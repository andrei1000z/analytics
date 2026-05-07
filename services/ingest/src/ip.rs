//! Daily-rotating IP hash. The hash is used solely for rate limiting within
//! the sliding window (see `rate.rs`). Salt rotates every 24h, so old hashes
//! become unlinkable to new ones once the day rolls over. See docs/ARCHITECTURE.md.

use std::sync::RwLock;

use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

pub struct SaltState {
    secret: Vec<u8>,
    inner: RwLock<(u64, [u8; 32])>,
}

fn day_id() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() / 86_400)
        .unwrap_or(0)
}

fn derive(secret: &[u8], day: u64) -> [u8; 32] {
    let mut mac = HmacSha256::new_from_slice(secret).expect("hmac key");
    mac.update(&day.to_be_bytes());
    mac.finalize().into_bytes().into()
}

impl SaltState {
    pub fn new(secret: &[u8]) -> Self {
        let day = day_id();
        let salt = derive(secret, day);
        SaltState {
            secret: secret.to_vec(),
            inner: RwLock::new((day, salt)),
        }
    }

    fn current_salt(&self) -> [u8; 32] {
        let today = day_id();
        if let Ok(g) = self.inner.read() {
            if g.0 == today {
                return g.1;
            }
        }
        let salt = derive(&self.secret, today);
        if let Ok(mut w) = self.inner.write() {
            if w.0 != today {
                w.0 = today;
                w.1 = salt;
            }
            return w.1;
        }
        salt
    }

    pub fn hash_ip(&self, ip: &str) -> [u8; 32] {
        let salt = self.current_salt();
        let mut mac = HmacSha256::new_from_slice(&salt).expect("hmac key");
        mac.update(ip.as_bytes());
        mac.finalize().into_bytes().into()
    }
}
