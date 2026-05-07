use std::net::SocketAddr;

use axum::body::Bytes;
use axum::extract::{ConnectInfo, Query, State};
use axum::http::{HeaderMap, StatusCode};
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

/// Pull the visitor's real IP from upstream proxy headers if present, else
/// fall back to the connection's peer address. Trust order:
///
///   1. `CF-Connecting-IP` — Cloudflare Tunnel / CDN
///   2. `X-Real-IP`        — Caddy / nginx reverse proxy
///   3. `X-Forwarded-For`  — generic chain, first entry is the original client
///   4. peer socket addr   — direct connection
///
/// Headers are only honored when the listening socket is bound behind a
/// trusted proxy (the deploy recipes bind to `127.0.0.1` for tunnel mode and
/// to the Caddy network alias for compose mode).
fn client_ip_from(headers: &HeaderMap, addr: &SocketAddr) -> String {
    for name in ["cf-connecting-ip", "x-real-ip"] {
        if let Some(v) = headers.get(name).and_then(|h| h.to_str().ok()) {
            let trimmed = v.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }
    if let Some(v) = headers
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
    {
        if let Some(first) = v.split(',').next() {
            let trimmed = first.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }
    addr.ip().to_string()
}

pub async fn handler(
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<AppState>,
    headers: HeaderMap,
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

    let client_ip = client_ip_from(&headers, &addr);
    let ip_hash = state.salt.hash_ip(&client_ip);
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
