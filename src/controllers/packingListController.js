'use strict';
const path   = require('path');
const fs     = require('fs');
const { parsePackingList } = require('../parsers/packingListParser');
const { buildLabels }      = require('../services/labelService');
const svc    = require('../services/packingListService');

async function index(req, res) {
  try {
    const lists = await svc.getAllPackingLists();
    res.render('packingLists/index', {
      title:    'Packing Lists — PrintLabel',
      lists,
      messages: {
        success: req.flash('success'),
        error:   req.flash('error'),
      },
    });
  } catch (err) {
    console.error('index error:', err);
    req.flash('error', 'Failed to load packing lists.');
    res.redirect('/');
  }
}

function showUpload(req, res) {
  res.render('packingLists/upload', {
    title:    'Upload Packing List — PrintLabel',
    messages: {
      success: req.flash('success'),
      error:   req.flash('error'),
    },
  });
}

async function handleUpload(req, res) {
  if (!req.file) {
    req.flash('error', 'Please select an XLSX file to upload.');
    return res.redirect('/packing-lists/upload');
  }

  const filePath     = req.file.path;
  const originalName = req.file.originalname;
  const filename     = req.file.filename;
  const uploadedBy   = req.session.user.id;

  try {
    const items = await parsePackingList(filePath);

    if (!items.length) {
      fs.unlinkSync(filePath);
      req.flash('error', 'No data rows found in the PACKINGLIST sheet. Please check the file.');
      return res.redirect('/packing-lists/upload');
    }

    const packingListId = await svc.createPackingList({ filename, originalName, uploadedBy });
    await svc.insertPackingListItems(packingListId, items);

    req.flash('success', `✅ Successfully imported ${items.length} items from "${originalName}".`);
    res.redirect(`/packing-lists/${packingListId}`);
  } catch (err) {
    console.error('Upload/parse error:', err);
    // Clean up the uploaded file on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    req.flash('error', `Failed to parse file: ${err.message}`);
    res.redirect('/packing-lists/upload');
  }
}

async function showDetail(req, res) {
  const id = parseInt(req.params.id);
  try {
    const list  = await svc.getPackingListById(id);
    if (!list) {
      req.flash('error', 'Packing list not found.');
      return res.redirect('/packing-lists');
    }
    const items   = await svc.getItemsByPackingListId(id);
    const history = await svc.getPrintHistory(id);

    res.render('packingLists/detail', {
      title:    `${list.original_name} — PrintLabel`,
      list,
      items,
      history,
      messages: {
        success: req.flash('success'),
        error:   req.flash('error'),
      },
    });
  } catch (err) {
    console.error('Detail error:', err);
    req.flash('error', 'Failed to load packing list details.');
    res.redirect('/packing-lists');
  }
}

function showPrintForm(req, res) {
  const id = parseInt(req.params.id);
  res.render('packingLists/printForm', {
    title:       'Print Labels — PrintLabel',
    packingListId: id,
    messages: {
      success: req.flash('success'),
      error:   req.flash('error'),
    },
  });
}

async function handlePrint(req, res) {
  const id           = parseInt(req.params.id);
  const customerName = (req.body.customerName || '').trim();
  const checkerName  = req.session.user.name;
  const resetBoxPerDo = req.body.resetBoxPerDo === 'true' ? 1 : 0;

  if (!customerName) {
    req.flash('error', 'Customer name is required.');
    return res.redirect(`/packing-lists/${id}/print`);
  }

  try {
    const list = await svc.getPackingListById(id);
    if (!list) {
      req.flash('error', 'Packing list not found.');
      return res.redirect('/packing-lists');
    }

    const labelId = await svc.recordPrint({
      packingListId: id,
      customerName,
      checkerName,
      resetBoxPerDo,
    });
    res.redirect(`/labels/${labelId}/print`);
  } catch (err) {
    console.error('Print error:', err);
    req.flash('error', 'Failed to generate labels.');
    res.redirect(`/packing-lists/${id}/print`);
  }
}

async function handleDelete(req, res) {
  const id = parseInt(req.params.id);
  try {
    await svc.deletePackingList(id);
    req.flash('success', 'Packing list deleted successfully.');
    res.redirect('/packing-lists');
  } catch (err) {
    console.error('Delete error:', err);
    req.flash('error', 'Failed to delete packing list.');
    res.redirect('/packing-lists');
  }
}

function showInstant(req, res) {
  res.render('packingLists/instant', {
    title:    'Instant Print — PrintLabel',
    messages: {
      success: req.flash('success'),
      error:   req.flash('error'),
    },
  });
}

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

  const filePath     = req.file.path;
  const checkerName  = req.session.user.name;

  try {
    const items = await parsePackingList(filePath);

    if (!items.length) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      req.flash('error', 'No data rows found in the PACKINGLIST sheet. Please check the file.');
      return res.redirect('/packing-lists/instant');
    }

    // Determine automatically if reset per DO is needed (if at least one item has noDo)
    const hasNoDo = items.some(item => item.noDo);
    const labels = buildLabels(items, customerName, checkerName, hasNoDo);

    // Clean up temporary file immediately
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    }).toUpperCase();

    res.render('labels/print', {
      title:        `Labels — ${customerName}`,
      labels,
      customerName,
      checkerName,
      printDate:    dateStr,
      recordId:     null, // stateless print doesn't have a generated label DB record ID
    });
  } catch (err) {
    console.error('Instant print error:', err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    req.flash('error', `Failed to parse file: ${err.message}`);
    res.redirect('/packing-lists/instant');
  }
}

module.exports = {
  index,
  showUpload,
  handleUpload,
  showDetail,
  showPrintForm,
  handlePrint,
  handleDelete,
  showInstant,
  handleInstant,
};
