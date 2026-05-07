import { Database } from "bun:sqlite";

export type Credential = {
  id: string;
  publicKey: string;
  counter: number;
  transports: string;
  userId: string;
  createdAt: number;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
};

export class AuthStore {
  private db: Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER NOT NULL,
        transports TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);
  }

  ensureUser(username: string): { id: string } {
    const existing = this.db
      .prepare<{ id: string }, [string]>("SELECT id FROM users WHERE username = ?")
      .get(username);
    if (existing) return existing;
    const id = crypto.randomUUID();
    this.db
      .prepare(
        "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
      )
      .run(id, username, Date.now());
    return { id };
  }

  getCredentialsForUser(userId: string): Credential[] {
    return this.db
      .prepare<Credential, [string]>(
        `SELECT id, user_id AS userId, public_key AS publicKey, counter, transports,
                created_at AS createdAt
         FROM credentials WHERE user_id = ?`,
      )
      .all(userId);
  }

  getCredentialById(id: string): Credential | null {
    return this.db
      .prepare<Credential, [string]>(
        `SELECT id, user_id AS userId, public_key AS publicKey, counter, transports,
                created_at AS createdAt
         FROM credentials WHERE id = ?`,
      )
      .get(id);
  }

  insertCredential(c: Credential): void {
    this.db
      .prepare(
        `INSERT INTO credentials (id, user_id, public_key, counter, transports, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(c.id, c.userId, c.publicKey, c.counter, c.transports, c.createdAt);
  }

  updateCredentialCounter(id: string, counter: number): void {
    this.db
      .prepare("UPDATE credentials SET counter = ? WHERE id = ?")
      .run(counter, id);
  }

  createSession(userId: string, ttlMs: number): string {
    const token = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .run(token, userId, now, now + ttlMs);
    return token;
  }

  resolveSession(token: string): Session | null {
    const row = this.db
      .prepare<Session, [string]>(
        `SELECT token, user_id AS userId, created_at AS createdAt, expires_at AS expiresAt
         FROM sessions WHERE token = ?`,
      )
      .get(token);
    if (!row) return null;
    if (row.expiresAt < Date.now()) {
      this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      return null;
    }
    return row;
  }

  deleteSession(token: string): void {
    this.db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  pruneExpired(): void {
    this.db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  }
}
