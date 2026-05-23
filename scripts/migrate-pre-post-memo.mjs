import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();
await client.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS pre_memo text");
await client.query("ALTER TABLE books ADD COLUMN IF NOT EXISTS post_memo text");
console.log("✓ pre_memo, post_memo columns added");
await client.end();
