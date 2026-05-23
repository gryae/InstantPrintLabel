'use strict';

/**
 * Auth controller — stateless (no database).
 * Login validates checker name + fixed password from env/config.
 * User identity is stored in the session only.
 */

const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'password123';

async function showLogin(req, res) {
  res.render('auth/login', {
    title:    'Login — PrintLabel',
    messages: {
      error:   req.flash('error'),
      success: req.flash('success'),
    },
  });
}

async function handleLogin(req, res) {
  const checkerName = (req.body.checkerName || '').trim();
  const password    = req.body.password;

  if (!checkerName || !password) {
    req.flash('error', 'Nama Checker dan password wajib diisi.');
    return res.redirect('/login');
  }

  if (password !== LOGIN_PASSWORD) {
    req.flash('error', 'Password salah.');
    return res.redirect('/login');
  }

  req.session.user = {
    id:      1,
    name:    checkerName,
    email:   'instant@printlabel.com',
    role:    'checker',
    isAdmin: false,
  };

  req.flash('success', `Welcome back, ${checkerName}!`);
  res.redirect('/packing-lists/instant');
}

function handleLogout(req, res) {
  req.session = null; // cookie-session: set to null to clear
  res.redirect('/login');
}

module.exports = { showLogin, handleLogin, handleLogout };
