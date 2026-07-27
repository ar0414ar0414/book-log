import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

// Vercel では実行インスタンスごとに Pool が作られるため、1インスタンスの
// 上限を抑えて Postgres 側の接続枯渇を防ぐ。
// dev では HMR のたびにモジュールが再評価され Pool が増えるので使い回す。
const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
