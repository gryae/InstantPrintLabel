'use strict';
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const router   = express.Router();
const ctrl     = require('../controllers/packingListController');
const { requireLogin } = require('../middleware/auth');

// ── Multer setup ──────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const ts   = Date.now();
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${ts}_${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.xlsx?$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
});

// ── Routes ────────────────────────────────────────────────────────────────────
router.get('/',                       requireLogin, ctrl.index);
router.get('/upload',                 requireLogin, ctrl.showUpload);
router.post('/upload',                requireLogin, upload.single('packingListFile'), ctrl.handleUpload);
router.get('/instant',                requireLogin, ctrl.showInstant);
router.post('/instant',               requireLogin, upload.single('packingListFile'), ctrl.handleInstant);
router.get('/:id',                    requireLogin, ctrl.showDetail);
router.get('/:id/print',              requireLogin, ctrl.showPrintForm);
router.post('/:id/print',             requireLogin, ctrl.handlePrint);
router.post('/:id/delete',            requireLogin, ctrl.handleDelete);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash('error', err.message);
    const dest = req.path.includes('instant') ? '/packing-lists/instant' : '/packing-lists/upload';
    return res.redirect(dest);
  }
  next(err);
});

module.exports = router;
