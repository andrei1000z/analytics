//! analytics-ingest — public-facing event collector.
//!
//! Endpoints:
//!   POST /e?s=<siteId-hex>   encrypted event (text/plain or octet-stream body)
//!   GET  /healthz            liveness probe
//!   WS   /sync?room=<siteId> dashboard live sync (slice + live)
//!
//! IP hashed with daily-rotating salt; retention <24h, never persisted,
//! never paired with siteId. See docs/ARCHITECTURE.md.

use std::net::SocketAddr;

use anyhow::Result;
use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

mod ip;
mod rate;
mod routes;
mod state;
mod store;

use state::AppState;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,sqlx=warn,hyper=warn")),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://./data.db?mode=rwc".to_string());
    let listen_addr: SocketAddr = std::env::var("LISTEN_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:3000".to_string())
        .parse()?;

    let state = AppState::new(&database_url).await?;
    state.spawn_cleanup_tasks();

    // Permissive CORS so cross-origin trackers + dashboards work.
    // Tighten via ALLOWED_ORIGINS env in deployment if you want to lock it.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .max_age(std::time::Duration::from_secs(86_400));

    let app = Router::new()
        .route("/healthz", get(routes::health::handler))
        .route("/e", post(routes::event::handler))
        .route("/sync", get(routes::sync::handler))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    tracing::info!(%listen_addr, "analytics-ingest listening");
    let listener = tokio::net::TcpListener::bind(listen_addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}
