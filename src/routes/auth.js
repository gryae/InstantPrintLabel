'use strict';
const express = require('express');
const router  = express.Router();
const { showLogin, handleLogin, handleLogout } = require('../controllers/authController');
const { redirectIfLoggedIn } = require('../middleware/auth');

router.get('/login',  redirectIfLoggedIn, showLogin);
router.post('/login', redirectIfLoggedIn, handleLogin);
router.get('/logout', handleLogout);

router.get('/change-lang/:lang', (req, res) => {
  const lang = req.params.lang === 'en' ? 'en' : 'id';
  if (req.session) {
    req.session.lang = lang;
  }
  res.redirect(req.get('referer') || '/');
});

module.exports = router;
