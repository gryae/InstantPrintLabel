'use strict';

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
 * Middleware: redirect authenticated users away from login page.
 */
function redirectIfLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/packing-lists/instant');
  }
  next();
}

module.exports = { requireLogin, redirectIfLoggedIn };
