use std::net::SocketAddr;

use axum::body::Bytes;
use axum::extract::{ConnectInfo, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::Deserialize;

use crate::routes;
use crate::state::AppState;
use crate::store;

const HOUR_MS: i64 = 60 * 60 * 1000;
const MIN_BODY: usize = 12 + 16; // IV + AES-GCM tag minimum
const MAX_BODY: usize = 4096;

#[derive(Deserialize)]
pub struct EventParams {
    /// Hex-encoded 32-byte siteId (PBKDF2 derivative, public).
    s: String,
}

pub async fn handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<AppState>,
    Query(params): Query<EventParams>,
    body: Bytes,
) -> impl IntoResponse {
    if body.len() < MIN_BODY || body.len() > MAX_BODY {
        return StatusCode::BAD_REQUEST;
    }
    let site_id = match routes::hex_decode(&params.s) {
        Some(b) => b,
        None => return StatusCode::BAD_REQUEST,
    };

    let ip_hash = state.salt.hash_ip(&addr.ip().to_string());
    let mut rate_key = Vec::with_capacity(site_id.len() + ip_hash.len());
    rate_key.extend_from_slice(&site_id);
    rate_key.extend_from_slice(&ip_hash);
    if !state.rate.check(rate_key) {
        return StatusCode::TOO_MANY_REQUESTS;
    }

    let now_ms = routes::current_ms();
    let bucket = now_ms - (now_ms % HOUR_MS);
    let cipher = body.to_vec();

    if let Err(e) = store::insert_event(&state.pool, &site_id, bucket, now_ms, &cipher).await {
        tracing::error!(error = %e, "insert_event failed");
        return StatusCode::INTERNAL_SERVER_ERROR;
    }

    let tx = state.broadcaster(&site_id);
    let _ = tx.send(cipher);

    StatusCode::ACCEPTED
}
