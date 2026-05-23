'use strict';
const { parseBoxRange } = require('../parsers/packingListParser');

/**
 * Split an item's QTY evenly across its box range.
 *
 * Algorithm:
 *   base = floor(qty / boxCount)
 *   remainder = qty % boxCount
 *   First `remainder` boxes get (base + 1), the rest get base.
 *   No decimals ever.
 *
 * @param {number} qty        Total quantity for the item
 * @param {string} noBoxRaw   Raw box string e.g. "1-3" or "5"
 * @returns {Array<{ boxNo: number, qtyInBox: number }>}
 */
function splitQtyAcrossBoxes(qty, noBoxRaw) {
  const boxes = parseBoxRange(noBoxRaw);
  if (boxes.length === 0) return [];

  const boxCount = boxes.length;
  const base      = Math.floor(qty / boxCount);
  const remainder = qty % boxCount;

  return boxes.map((boxNo, idx) => ({
    boxNo,
    qtyInBox: idx < remainder ? base + 1 : base,
  }));
}

/**
 * Build a map of box keys → list of { item, qtyInBox, boxNo } entries.
 * Each entry represents one item appearing in a given box.
 *
 * @param {import('../parsers/packingListParser').ParsedItem[]} items
 * @param {boolean} resetBoxPerDo
 * @returns {Map<string, Array<{ item: Object, qtyInBox: number, boxNo: number }>>}
 */
function groupItemsByBox(items, resetBoxPerDo = false) {
  /** @type {Map<string, Array>} */
  const boxMap = new Map();

  for (const item of items) {
    // DB mengembalikan snake_case: no_box_raw, weight_kg, qty_of_box, dll.
    // Dukung keduanya (camelCase dari parser dan snake_case dari DB)
    const noBoxRaw = item.no_box_raw !== undefined ? item.no_box_raw : item.noBoxRaw;
    const itemNoDo = item.no_do !== undefined ? item.no_do : item.noDo;
    const splits = splitQtyAcrossBoxes(item.qty, noBoxRaw);

    for (const { boxNo, qtyInBox } of splits) {
      const key = (resetBoxPerDo && itemNoDo) ? `${itemNoDo}_${boxNo}` : `global_${boxNo}`;
      if (!boxMap.has(key)) boxMap.set(key, []);
      boxMap.get(key).push({ item, qtyInBox, boxNo });
    }
  }

  // Sort groups by their occurrence sequence (i.e. the minimum item id or rowIndex of the group)
  // to ensure natural chronological ordering matches the Excel spreadsheet exactly.
  const sortedEntries = [...boxMap.entries()].sort((entryA, entryB) => {
    const listA = entryA[1];
    const listB = entryB[1];
    
    const idA = listA[0].item.id || listA[0].item.rowIndex || 0;
    const idB = listB[0].item.id || listB[0].item.rowIndex || 0;
    
    if (idA !== idB) return idA - idB;

    const boxNoA = listA[0].boxNo || 0;
    const boxNoB = listB[0].boxNo || 0;
    return boxNoA - boxNoB;
  });

  return new Map(sortedEntries);
}

/**
 * Build a flat list of labels from packing list items.
 * Each label represents one box with all its items and quantities.
 *
 * @param {Object[]} dbItems          Rows from packing_list_items table
 * @param {string}   customerName
 * @param {string}   checkerName
 * @param {boolean}  resetBoxPerDo
 * @returns {Array<LabelData>}
 *
 * @typedef {Object} LabelData
 * @property {number}   boxNo
 * @property {string}   customerName
 * @property {string}   checkerName
 * @property {string}   noDo            e.g. "5993" or null
 * @property {string}   headerText      e.g. "SUTORANG , NO BOX 1"
 * @property {number}   weightKg        per-box weight
 * @property {Object[]} lineItems       array of { code, description, qtyInBox }
 */
function buildLabels(dbItems, customerName, checkerName, resetBoxPerDo = false) {
  const boxMap = groupItemsByBox(dbItems, resetBoxPerDo);
  const labels = [];
  const ITEMS_PER_LABEL = 15;

  for (const [key, entries] of boxMap) {
    const boxNo = entries[0].boxNo;
    let noDo = null;
    for (const entry of entries) {
      const itemNoDo = entry.item.no_do !== undefined ? entry.item.no_do : entry.item.noDo;
      if (itemNoDo) {
        noDo = itemNoDo;
        break;
      }
    }

    const weightKg = entries.length > 0
      ? (entries[0].item.weight_kg !== undefined
          ? entries[0].item.weight_kg
          : entries[0].item.weightKg || 0)
      : 0;

    const pageCount = Math.ceil(entries.length / ITEMS_PER_LABEL);

    for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
      const pageEntries = entries.slice(pageIdx * ITEMS_PER_LABEL, (pageIdx + 1) * ITEMS_PER_LABEL);
      const partSuffix = pageCount > 1 ? ` (${pageIdx + 1}/${pageCount})` : '';
      // Header: pakai "," sebagai pemisah customer dan NO BOX (bukan "/")
      // Format dengan NO DO: header tetap "CUSTOMER , NO BOX Y", footer tampilkan NO DO/BOX info
      const headerText = `${customerName.toUpperCase()} , NO BOX ${boxNo}${partSuffix}`;

      labels.push({
        boxNo,
        noDo: noDo || null,
        customerName: customerName.toUpperCase(),
        checkerName,
        headerText,
        weightKg,
        lineItems: pageEntries.map(({ item, qtyInBox }) => ({
          code:        item.code,
          description: item.description,
          qtyInBox,
        })),
      });
    }
  }

  return labels;
}

module.exports = { splitQtyAcrossBoxes, groupItemsByBox, buildLabels };
