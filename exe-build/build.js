/**
 * build.js — Automated build script for PrintLabel.exe
 *
 * Run this with:  node build.js   (from inside exe-build/)
 *
 * Key insight: pkg must be invoked from the ROOT of the project so it
 * discovers the root node_modules (express, ejs, exceljs, etc.).
 * The launcher.js is copied to root temporarily, then removed after build.
 */

'use strict';

const { execSync } = require('child_process');
const path         = require('path');
const fs           = require('fs');

const ROOT     = path.join(__dirname, '..');          // c:\…\PrintLabel
const EXE_DIR  = __dirname;                           // c:\…\PrintLabel\exe-build
const DIST_DIR = path.join(EXE_DIR, 'dist');

function run(cmd, cwd = ROOT) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

function step(msg) {
  console.log(`\n${'─'.repeat(54)}\n✅  ${msg}\n${'─'.repeat(54)}`);
}

console.log(`
╔══════════════════════════════════════════════════╗
║      PrintLabel — .exe Build Pipeline            ║
╚══════════════════════════════════════════════════╝
`);

// ── Step 1: Build Tailwind CSS ────────────────────────────────────────────────
step('Step 1/5 — Building Tailwind CSS (minified)...');
run('npm run build', ROOT);

// ── Step 2: Install pkg in root devDependencies (if not present) ──────────────
step('Step 2/5 — Ensuring pkg is available at root...');
try {
  require.resolve(path.join(ROOT, 'node_modules', 'pkg', 'package.json'));
  console.log('   pkg already installed in root. Skipping.');
} catch (_) {
  run('npm install --save-dev pkg@5.8.1', ROOT);
}

// ── Step 3: Copy launcher + pkg config to root (temp) ────────────────────────
step('Step 3/5 — Staging launcher.js and pkg.config.json to root...');

const launcherSrc    = path.join(EXE_DIR, 'launcher.js');
const launcherDest   = path.join(ROOT, 'launcher.js');
const pkgCfgSrc      = path.join(EXE_DIR, 'pkg.config.json');
const pkgCfgDest     = path.join(ROOT, 'pkg.config.json');

fs.copyFileSync(launcherSrc,  launcherDest);
fs.copyFileSync(pkgCfgSrc,    pkgCfgDest);
console.log('   Copied launcher.js  →  project root (temp)');
console.log('   Copied pkg.config.json  →  project root (temp)');

// ── Step 4: Run pkg from ROOT ─────────────────────────────────────────────────
step('Step 4/5 — Packaging into PrintLabel.exe...');
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

try {
  run(
    `npx pkg launcher.js --targets node18-win-x64 --output exe-build/dist/PrintLabel.exe --config pkg.config.json`,
    ROOT
  );
} finally {
  // ── Cleanup temp files from root ─────────────────────────────────────────
  try { fs.unlinkSync(launcherDest); }  catch (_) {}
  try { fs.unlinkSync(pkgCfgDest); }   catch (_) {}
  console.log('\n   Cleaned up temp files from root.');
}

// ── Step 5: Create uploads folder next to .exe ───────────────────────────────
step('Step 5/5 — Creating uploads/ folder next to .exe...');
const distUploads = path.join(DIST_DIR, 'uploads');
if (!fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });
fs.writeFileSync(path.join(distUploads, '.gitkeep'), '');

// ── Done ──────────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════╗
║  🎉  BUILD COMPLETE!                             ║
╠══════════════════════════════════════════════════╣
║  Output  :  exe-build/dist/PrintLabel.exe        ║
║                                                  ║
║  Distribute the ENTIRE dist/ folder:             ║
║    dist/                                         ║
║    ├── PrintLabel.exe   ← main executable        ║
║    └── uploads/         ← writable data folder   ║
╚══════════════════════════════════════════════════╝
`);
