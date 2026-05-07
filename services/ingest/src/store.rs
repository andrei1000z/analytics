use anyhow::Result;
use sqlx::sqlite::SqlitePool;
use sqlx::Row;

pub async fn init(pool: &SqlitePool) -> Result<()> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id BLOB NOT NULL,
            time_bucket INTEGER NOT NULL,
            received_at INTEGER NOT NULL,
            ciphertext BLOB NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        CREATE INDEX IF NOT EXISTS idx_events_site_bucket
        ON events (site_id, time_bucket)
        "#,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn insert_event(
    pool: &SqlitePool,
    site_id: &[u8],
    bucket_ms: i64,
    received_at_ms: i64,
    ciphertext: &[u8],
) -> Result<()> {
    sqlx::query(
        "INSERT INTO events (site_id, time_bucket, received_at, ciphertext) VALUES (?, ?, ?, ?)",
    )
    .bind(site_id)
    .bind(bucket_ms)
    .bind(received_at_ms)
    .bind(ciphertext)
    .execute(pool)
    .await?;
    Ok(())
}

/// Return up to 100k rows for a slice. Each row is `(time_bucket_ms, ciphertext)`.
pub async fn query_slice(
    pool: &SqlitePool,
    site_id: &[u8],
    from_ms: i64,
    to_ms: i64,
) -> Result<Vec<(i64, Vec<u8>)>> {
    let rows = sqlx::query(
        r#"
        SELECT time_bucket, ciphertext
        FROM events
        WHERE site_id = ? AND time_bucket >= ? AND time_bucket <= ?
        ORDER BY received_at ASC
        LIMIT 100000
        "#,
    )
    .bind(site_id)
    .bind(from_ms)
    .bind(to_ms)
    .fetch_all(pool)
    .await?;

    let out = rows
        .into_iter()
        .map(|r| {
            let t: i64 = r.try_get("time_bucket").unwrap_or(0);
            let c: Vec<u8> = r.try_get("ciphertext").unwrap_or_default();
            (t, c)
        })
        .collect();
    Ok(out)
}
