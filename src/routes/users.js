'use strict';
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

router.get('/',            requireAdmin, ctrl.index);
router.get('/new',         requireAdmin, ctrl.showCreate);
router.post('/',           requireAdmin, ctrl.handleCreate);
router.get('/:id/edit',    requireAdmin, ctrl.showEdit);
router.post('/:id/edit',   requireAdmin, ctrl.handleEdit);
router.post('/:id/delete', requireAdmin, ctrl.handleDelete);

module.exports = router;
