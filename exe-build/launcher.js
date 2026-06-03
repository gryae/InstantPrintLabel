/**
 * launcher.js — Entry point for the packaged .exe
 *
 * NOTE: This file DOES NOT modify any of the original source code.
 *       pkg is run from the ROOT of the project so it picks up
 *       the root node_modules (ejs, express, exceljs, etc.)
 */

'use strict';

const path = require('path');
const { exec } = require('child_process');
const fs   = require('fs');

// ── Force pkg to bundle these dynamic requires ────────────────────────────────
// Express loads the view engine with require(engineName) — pkg can't detect this.
// Listing them explicitly here ensures they are included in the .exe bundle.
require('ejs');
require('exceljs');
require('multer');
require('pako');


// ── Port ──────────────────────────────────────────────────────────────────────
const PORT    = process.env.PORT || 3001;
const APP_URL = `http://localhost:${PORT}`;

// ── Resolve real writable path (outside the pkg snapshot) ────────────────────
const isPackaged = typeof process.pkg !== 'undefined';
const exeDir     = isPackaged
  ? path.dirname(process.execPath)   // real folder where .exe lives
  : path.join(__dirname, '..');      // project root when running via node

// ── Uploads dir next to the .exe (writable) ───────────────────────────────────
const uploadsDir = path.join(exeDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

// ── Env vars (set BEFORE loading app.js) ─────────────────────────────────────
process.env.PORT           = String(PORT);
process.env.NODE_ENV       = 'development';   // MUST be non-production — 'production' sets secure:true on cookies which breaks HTTP localhost
process.env.VERCEL         = '';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'printlabel_local_exe_secret_2026';
process.env.UPLOAD_DIR     = uploadsDir;
process.env.UPLOAD_RESOLVED = uploadsDir;


// ── Load app ──────────────────────────────────────────────────────────────────
require('./src/app.js');

// ── Auto-open browser ─────────────────────────────────────────────────────────
function openBrowser(url) {
  exec(`start "" "${url}"`, (err) => {
    if (err) console.log(`\n✅  Open your browser: ${url}\n`);
  });
}

setTimeout(() => openBrowser(APP_URL), 1500);

console.log(`
╔══════════════════════════════════════════╗
║        PrintLabel — Local Mode           ║
╠══════════════════════════════════════════╣
║  Server  : ${APP_URL.padEnd(30)}  ║
║  Uploads : ${uploadsDir.slice(0, 30).padEnd(30)}  ║
╚══════════════════════════════════════════╝
`);
