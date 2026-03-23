/**
 * Creates aletheia and aletheia_test databases if they don't exist.
 * Run from aletheia-backend with: node scripts/create-databases.cjs
 * Uses DATABASE_URL from .env (or .env.test for port/host) - creates DBs on same server.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { Client } = require('pg');

// Parse DATABASE_URL to get connection params, but connect to 'postgres' db for CREATE
// Try DATABASE_URL, or common defaults
const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!match) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}
const [, user, password, host, port, dbName] = match;

const connectionConfig = {
  user,
  password,
  host,
  port: parseInt(port, 10),
  database: 'postgres', // Connect to default DB to run CREATE DATABASE
};

const databases = ['aletheia', 'aletheia_test'];

async function main() {
  const client = new Client(connectionConfig);
  try {
    await client.connect();
    for (const db of databases) {
      const res = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [db]
      );
      if (res.rows.length === 0) {
        await client.query(`CREATE DATABASE ${db}`);
        console.log(`Created database: ${db}`);
      } else {
        console.log(`Database already exists: ${db}`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code) console.error('Code:', err.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
