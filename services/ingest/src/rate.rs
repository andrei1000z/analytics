//! Per-key sliding-window rate limiter. Key is `site_id || ip_hash`.
//! Cap: 60 events / 60 s. Eviction sweep every 30 s drops empty entries
//! and any whose youngest sample is older than 5 minutes.

use std::time::{Duration, Instant};

use dashmap::DashMap;

const WINDOW: Duration = Duration::from_secs(60);
const MAX_PER_WINDOW: usize = 60;
const EVICT_HORIZON: Duration = Duration::from_secs(300);

pub struct RateLimiter {
    map: DashMap<Vec<u8>, Vec<Instant>>,
}

impl RateLimiter {
    pub fn new() -> Self {
        RateLimiter {
            map: DashMap::new(),
        }
    }

    /// Returns true if the request is allowed (and counted), false if throttled.
    pub fn check(&self, key: Vec<u8>) -> bool {
        let now = Instant::now();
        let mut entry = self.map.entry(key).or_insert_with(Vec::new);
        entry.retain(|t| now.duration_since(*t) < WINDOW);
        if entry.len() >= MAX_PER_WINDOW {
            return false;
        }
        entry.push(now);
        true
    }

    pub fn evict_old(&self) {
        let now = Instant::now();
        self.map.retain(|_, ts| {
            ts.retain(|t| now.duration_since(*t) < WINDOW);
            !ts.is_empty()
                && ts
                    .iter()
                    .any(|t| now.duration_since(*t) < EVICT_HORIZON)
        });
    }
}
