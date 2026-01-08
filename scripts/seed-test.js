// scripts/seed-test.js
// Wrapper script to seed test database
process.env.SEED_TEST_DB = 'true';
const { execSync } = require('child_process');
execSync('ts-node --esm prisma/seed.ts', { stdio: 'inherit', cwd: __dirname + '/..' });
