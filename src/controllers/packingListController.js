'use strict';
const path = require('path');
const fs   = require('fs');
const { parsePackingList } = require('../parsers/packingListParser');
const { buildLabels }      = require('../services/labelService');

/**
 * GET /packing-lists/instant
 * Show the instant print upload form.
 */
function showInstant(req, res) {
  res.render('packingLists/instant', {
    title:    'Instant Print — PrintLabel',
    messages: {
      success: req.flash('success'),
      error:   req.flash('error'),
    },
  });
}

/**
 * POST /packing-lists/instant
 * Parse XLSX and render labels immediately — no database involved.
 */
async function handleInstant(req, res) {
  if (!req.file) {
    req.flash('error', 'Please select an XLSX file to upload.');
    return res.redirect('/packing-lists/instant');
  }

  const customerName = (req.body.customerName || '').trim();
  if (!customerName) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    req.flash('error', 'Customer name is required.');
    return res.redirect('/packing-lists/instant');
  }

  const filePath    = req.file.path;
  const checkerName = req.session.user.name;

  try {
    const items = await parsePackingList(filePath);

    if (!items.length) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      req.flash('error', 'No data rows found in the PACKINGLIST sheet. Please check the file.');
      return res.redirect('/packing-lists/instant');
    }

    // Support explicit format selection from UI, or auto-detect
    const selectedFormat = req.body.labelFormat || 'auto';
    const hasBoxColumn   = items.some(item => item.boxRaw !== null && item.boxRaw !== undefined && item.boxRaw !== '');
    const hasNoDo        = items.some(item => item.noDo);
    
    let resetPerDo = hasBoxColumn || hasNoDo;
    if (selectedFormat === 'format2' || selectedFormat === 'format3') {
      resetPerDo = true;
    } else if (selectedFormat === 'format1') {
      resetPerDo = false;
    }

    const labels = buildLabels(items, customerName, checkerName, resetPerDo, selectedFormat);

    // Clean up temp file immediately
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    }).toUpperCase(); // e.g. "22 MAY 2026"

    res.render('labels/print', {
      title:        `Labels — ${customerName}`,
      labels,
      customerName,
      checkerName,
      printDate:    dateStr,
    });
  } catch (err) {
    console.error('Instant print error:', err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    req.flash('error', `Failed to parse file: ${err.message}`);
    res.redirect('/packing-lists/instant');
  }
}

module.exports = { showInstant, handleInstant };
