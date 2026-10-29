import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined.");
}

const isProduction = process.env.NODE_ENV === "production";
const requiresSsl =
  isProduction ||
  Boolean(
    databaseUrl &&
      (databaseUrl.includes("sslmode=require") ||
        databaseUrl.includes("ssl=true") ||
        databaseUrl.includes("neon.tech") ||
        databaseUrl.includes("supabase.co") ||
        databaseUrl.includes("render.com") ||
        databaseUrl.includes("railway.app") ||
        databaseUrl.includes("aivencloud.com"))
  );

const poolConfig: PoolConfig = {
  connectionString: databaseUrl,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
};

export const pool = new Pool(poolConfig);

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255) UNIQUE,
        reset_token VARCHAR(255) UNIQUE,
        reset_token_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS urls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        original_url TEXT NOT NULL,
        short_code VARCHAR(255) UNIQUE NOT NULL,
        custom_alias VARCHAR(255) UNIQUE,
        click_count INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ,
        password_hash VARCHAR(255),
        is_one_time BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        device_name VARCHAR(255),
        ip_address VARCHAR(255),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url_id UUID REFERENCES urls(id) ON DELETE CASCADE NOT NULL,
        ip_address VARCHAR(255),
        user_agent TEXT,
        visited_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
      CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_urls_custom_alias ON urls(custom_alias);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
      CREATE INDEX IF NOT EXISTS idx_visits_url_id ON visits(url_id);
      CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
    `);
    console.log("Database initialized successfully.");
  } finally {
    client.release();
  }
}
