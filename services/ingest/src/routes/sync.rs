use axum::extract::ws::{Message, Utf8Bytes, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use base64::Engine;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::routes;
use crate::state::AppState;
use crate::store;

const OUTBOUND_CHANNEL_CAP: usize = 64;

#[derive(Deserialize)]
pub struct SyncParams {
    /// Hex-encoded 32-byte siteId.
    room: String,
}

pub async fn handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(params): Query<SyncParams>,
) -> impl IntoResponse {
    let site = match routes::hex_decode(&params.room) {
        Some(b) => b,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };
    ws.on_upgrade(move |socket| handle_socket(socket, state, site))
}

async fn handle_socket(socket: WebSocket, state: AppState, site: Vec<u8>) {
    let (mut sender, mut receiver) = socket.split();
    let mut bcast = state.broadcaster(&site).subscribe();

    let (out_tx, mut out_rx) =
        tokio::sync::mpsc::channel::<Message>(OUTBOUND_CHANNEL_CAP);

    // Forward broadcast → outbound queue
    let bcast_to = out_tx.clone();
    let bcast_task = tokio::spawn(async move {
        while let Ok(cipher) = bcast.recv().await {
            let payload = json!({
                "type": "live",
                "ciphertext": base64::engine::general_purpose::STANDARD.encode(&cipher),
            })
            .to_string();
            if bcast_to
                .send(Message::Text(Utf8Bytes::from(payload)))
                .await
                .is_err()
            {
                break;
            }
        }
    });

    // Inbound (subscribe / ping) → outbound queue
    let inbound_to = out_tx.clone();
    let pool = state.pool.clone();
    let site_inner = site.clone();
    let inbound_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    let v: Value = match serde_json::from_str(text.as_str()) {
                        Ok(v) => v,
                        Err(_) => continue,
                    };
                    match v.get("type").and_then(|t| t.as_str()) {
                        Some("subscribe") => {
                            let from = v.get("from").and_then(Value::as_i64).unwrap_or(0);
                            let to = v.get("to").and_then(Value::as_i64).unwrap_or(i64::MAX);
                            match store::query_slice(&pool, &site_inner, from, to).await {
                                Ok(rows) => {
                                    let buckets: Vec<Value> = rows
                                        .into_iter()
                                        .map(|(t, c)| {
                                            json!({
                                                "t": t,
                                                "ciphertext": base64::engine::general_purpose::STANDARD
                                                    .encode(&c),
                                            })
                                        })
                                        .collect();
                                    let payload = json!({
                                        "type": "slice",
                                        "buckets": buckets,
                                    })
                                    .to_string();
                                    if inbound_to
                                        .send(Message::Text(Utf8Bytes::from(payload)))
                                        .await
                                        .is_err()
                                    {
                                        break;
                                    }
                                }
                                Err(e) => {
                                    tracing::error!(error = %e, "query_slice failed");
                                }
                            }
                        }
                        Some("ping") => {
                            let payload = json!({ "type": "pong" }).to_string();
                            if inbound_to
                                .send(Message::Text(Utf8Bytes::from(payload)))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        _ => {}
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    // Drain outbound queue → socket
    while let Some(msg) = out_rx.recv().await {
        if sender.send(msg).await.is_err() {
            break;
        }
    }

    bcast_task.abort();
    inbound_task.abort();
}
