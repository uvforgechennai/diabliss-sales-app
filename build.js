// Plain-Node build step (no external dependencies) that concatenates the
// app's JS modules into a single file, so the browser makes one request
// instead of thirteen on every load. Runs in CI right before the FTP
// deploy step — if this throws, the workflow stops and nothing broken
// ever reaches production.
const fs = require('fs');

const FILES = [
  'pricing.js',
  'app-core.js',
  'app-ui-helpers.js',
  'app-visit-flow.js',
  'app-admin-master.js',
  'app-dash-reports.js',
  'app-corrections.js',
  'app-targets-expenses.js',
  'app-ledger-invoice.js',
  'app-data-sync.js',
  'app-features-new.js',
  'app-features-v2.js',
  'app-chatbot.js',
];

const OUTPUT = 'app-bundle.js';

const parts = FILES.map(f => {
  const content = fs.readFileSync(f, 'utf8');
  return `/* ---- ${f} ---- */\n${content}`;
});

// Leading semicolon between files guards against ASI pitfalls (e.g. a file
// ending without a semicolon followed by one starting with '(' or '[').
fs.writeFileSync(OUTPUT, parts.join('\n;\n'));

console.log(`Built ${OUTPUT} from ${FILES.length} files (${fs.statSync(OUTPUT).size} bytes)`);
