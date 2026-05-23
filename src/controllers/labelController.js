'use strict';
const svc          = require('../services/packingListService');
const { buildLabels } = require('../services/labelService');

async function printLabels(req, res) {
  const labelRecordId = parseInt(req.params.id);

  try {
    const record = await svc.getGeneratedLabelById(labelRecordId);
    if (!record) {
      return res.status(404).render('error', {
        title:   'Not Found',
        message: 'Label record not found.',
      });
    }

    const items = await svc.getItemsByPackingListId(record.packing_list_id);
    const labels = buildLabels(
      items,
      record.customer_name,
      record.checker_name,
      record.reset_box_per_do === 1
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    }).toUpperCase(); // e.g. "22 MAY 2026"

    res.render('labels/print', {
      title:        `Labels — ${record.customer_name}`,
      labels,
      customerName: record.customer_name,
      checkerName:  record.checker_name,
      printDate:    dateStr,
      recordId:     labelRecordId,
    });
  } catch (err) {
    console.error('Label print error:', err);
    res.status(500).render('error', {
      title:   'Error',
      message: 'Failed to generate labels: ' + err.message,
    });
  }
}

module.exports = { printLabels };
