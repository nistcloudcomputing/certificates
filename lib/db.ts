import postgres, { Sql } from "postgres";

declare global {
  var pgClient: Sql | undefined;
  var pgInitPromise: Promise<void> | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  return databaseUrl;
}

export function getDbClient() {
  if (!global.pgClient) {
    global.pgClient = postgres(getDatabaseUrl(), {
      max: 5,
      prepare: false,
    });
  }

  return global.pgClient;
}

export async function ensureDbSchema() {
  if (!global.pgInitPromise) {
    const sql = getDbClient();

    global.pgInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          file_key TEXT NOT NULL DEFAULT '',
          download_count INTEGER NOT NULL DEFAULT 0,
          download_limit INTEGER NOT NULL DEFAULT 2,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS download_limit INTEGER NOT NULL DEFAULT 2
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS logs (
          id BIGSERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          ip TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
      await sql`CREATE INDEX IF NOT EXISTS logs_email_idx ON logs (email)`;
      await sql`CREATE INDEX IF NOT EXISTS logs_timestamp_idx ON logs (timestamp DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS logs_status_idx ON logs (status)`;
    })();
  }

  await global.pgInitPromise;
}
