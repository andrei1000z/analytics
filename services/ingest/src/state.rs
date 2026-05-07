use std::sync::Arc;

use anyhow::Result;
use dashmap::DashMap;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use tokio::sync::broadcast;

use crate::ip::SaltState;
use crate::rate::RateLimiter;

const BROADCAST_CAPACITY: usize = 256;

pub type Rooms = Arc<DashMap<Vec<u8>, broadcast::Sender<Vec<u8>>>>;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub salt: Arc<SaltState>,
    pub rate: Arc<RateLimiter>,
    pub rooms: Rooms,
}

impl AppState {
    pub async fn new(database_url: &str) -> Result<Self> {
        let pool = SqlitePoolOptions::new()
            .max_connections(8)
            .connect(database_url)
            .await?;
        crate::store::init(&pool).await?;

        let secret = std::env::var("INGEST_SECRET")
            .unwrap_or_else(|_| "dev-only-secret-rotate-in-prod".to_string());
        let salt = Arc::new(SaltState::new(secret.as_bytes()));
        let rate = Arc::new(RateLimiter::new());

        Ok(AppState {
            pool,
            salt,
            rate,
            rooms: Arc::new(DashMap::new()),
        })
    }

    pub fn spawn_cleanup_tasks(&self) {
        let rate = self.rate.clone();
        tokio::spawn(async move {
            let mut tick = tokio::time::interval(std::time::Duration::from_secs(30));
            tick.tick().await;
            loop {
                tick.tick().await;
                rate.evict_old();
            }
        });
    }

    pub fn broadcaster(&self, site_id: &[u8]) -> broadcast::Sender<Vec<u8>> {
        if let Some(s) = self.rooms.get(site_id) {
            return s.clone();
        }
        let (tx, _rx) = broadcast::channel(BROADCAST_CAPACITY);
        self.rooms.insert(site_id.to_vec(), tx.clone());
        tx
    }
}
