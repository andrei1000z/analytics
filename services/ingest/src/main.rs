//! analytics-ingest — public-facing event collector. Phase 4 deliverable.
//!
//! Endpoints:
//!   POST /e                  — encrypted event (octet-stream body)
//!   GET  /healthz            — liveness probe
//!   WS   /sync?room=<siteId> — dashboard live sync (slice + live)
//!
//! IP hashed at TLS terminator with daily-rotating salt; retention < 24h;
//! never persisted, never paired with siteId. See docs/ARCHITECTURE.md.

fn main() {
    println!("analytics-ingest: Phase 4 not yet implemented");
}
