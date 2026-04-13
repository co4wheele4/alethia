/* eslint-disable no-console */
/**
 * MVP release: fail if inference / embedding surfaces reappear in schema snapshot.
 */
const fs = require('node:fs');
const path = require('node:path');

const FORBIDDEN = [
  /\btype\s+Embedding\b/i,
  /\btype\s+AiQuery\b/i,
  /\btype\s+AiQueryResult\b/i,
  /\btype\s+AiExtractionSuggestion\b/i,
  /\baskAI\b/i,
  /\baskAi\b/i,
  /\bproposeExtraction\b/i,
  /\bcreateEmbedding\b/i,
  /\bupdateEmbedding\b/i,
  /\bdeleteEmbedding\b/i,
  /\bembeddings\b/i,
  /\bembeddingsByChunk\b/i,
];

function main() {
  const schemaPath = path.resolve(__dirname, '../src/schema.gql');
  const sdl = fs.readFileSync(schemaPath, 'utf8');
  const errors = [];
  for (const re of FORBIDDEN) {
    if (re.test(sdl)) {
      errors.push(`MVP schema lint: forbidden pattern ${re}`);
    }
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('MVP schema lint: OK');
}

main();
