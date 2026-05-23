'use strict';

const ADMIN_EMAIL = 'admin@printlabel.com';

/**
 * Middleware: require the user to be logged in.
 * Redirects to /login with a flash message if not authenticated.
 */
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.flash('error', 'Please log in to continue.');
  res.redirect('/login');
}

/**
 * Middleware: require admin privileges (admin@printlabel.com only).
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.email === ADMIN_EMAIL) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.flash('error', 'Access denied. Admin only.');
  res.redirect('/packing-lists');
}

/**
 * Middleware: redirect authenticated users away from login page.
 */
function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/packing-lists');
  }
  next();
}

module.exports = { requireLogin, requireAdmin, redirectIfLoggedIn };
