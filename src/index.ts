import https from 'https';
import fs from 'fs';
import path from 'path';
import createApp from './app';

const PORT = parseInt(process.env.PORT ?? '3443', 10);

// --- Load mkcert-generated certs (trusted by all browsers) ---
// Run once: mkcert -install && mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost
const CERT_DIR = path.join(process.cwd(), 'certs');
const KEY_FILE  = path.join(CERT_DIR, 'key.pem');
const CERT_FILE = path.join(CERT_DIR, 'cert.pem');

function loadCerts(): { key: Buffer; cert: Buffer } {
  if (!fs.existsSync(KEY_FILE) || !fs.existsSync(CERT_FILE)) {
    console.error('\n❌  TLS certs not found!');
    console.error(`   Expected:\n     ${KEY_FILE}\n     ${CERT_FILE}`);
    console.error('\n   Run these commands once to generate them:');
    console.error('     mkcert -install');
    console.error('     mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost\n');
    process.exit(1);
  }
  return {
    key:  fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CERT_FILE),
  };
}

const { key, cert } = loadCerts();
const app = createApp();

const server = https.createServer({ key, cert }, app);

server.listen(PORT, () => {
  console.log(`\n🔐 OrthodoxConnect API (HTTPS) → https://localhost:${PORT}`);
  console.log(`   ✅ Root:         https://localhost:${PORT}/`);
  console.log(`   ✅ Health check: https://localhost:${PORT}/health`);
  console.log(`   📡 API base:     https://localhost:${PORT}/api/v1\n`);
});
