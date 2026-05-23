'use strict';
require('dotenv').config();

const express        = require('express');
const session        = require('cookie-session');
const flash          = require('connect-flash');
const path           = require('path');
const fs             = require('fs');

const { translate }         = require('./utils/i18n');
const authRoutes            = require('./routes/auth');
const packingListRoutes      = require('./routes/packingLists');

const app  = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(session({
  name:     'session',
  keys:     [process.env.SESSION_SECRET || 'dev_secret_change_me'],
  maxAge:   8 * 60 * 60 * 1000,
  secure:   process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
}));

// ── Flash messages ────────────────────────────────────────────────────────────
app.use(flash());

// ── Global template locals ────────────────────────────────────────────────────
app.use((req, res, next) => {
  const currentLang = (req.session && req.session.lang) ? req.session.lang : 'id';
  res.locals.currentUser = req.session.user || null;
  res.locals.appName     = 'PrintLabel';
  res.locals.currentLang = currentLang;
  res.locals.__          = (key, ...args) => translate(currentLang, key, ...args);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/packing-lists/instant');
  res.redirect('/login');
});

app.use('/', authRoutes);
app.use('/packing-lists', packingListRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title:   '404 — Not Found',
    message: `The page "${req.path}" was not found.`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).render('error', {
    title:   `${status} — Error`,
    message: process.env.NODE_ENV === 'development' ? err.message : 'An internal error occurred.',
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
if (!process.env.VERCEL) {
  // Ensure uploads directory exists (local/PM2 only)
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn(`⚠️ Warning: Could not create uploads directory: ${err.message}`);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀  PrintLabel server running at http://localhost:${PORT}`);
    console.log(`📋  Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = app;
