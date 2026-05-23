'use strict';
const express = require('express');
const router  = express.Router();
const { printLabels } = require('../controllers/labelController');
const { requireLogin } = require('../middleware/auth');

router.get('/:id/print', requireLogin, printLabels);

module.exports = router;
