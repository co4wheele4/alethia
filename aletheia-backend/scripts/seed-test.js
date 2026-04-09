// scripts/seed-test.js
// Wrapper script to seed test database
process.env.SEED_TEST_DB = 'true';
const { execSync } = require('child_process');
// Match `npm run seed` (avoid `ts-node --esm`, which breaks on newer Node with this package layout).
execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit', cwd: __dirname + '/..' });
