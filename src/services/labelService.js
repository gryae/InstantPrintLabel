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

  const boxCount  = boxes.length;
  const base      = Math.floor(qty / boxCount);
  const remainder = qty % boxCount;

  return boxes.map((boxNo, idx) => ({
    boxNo,
    qtyInBox: idx < remainder ? base + 1 : base,
  }));
}

/**
 * Build a map of box keys → list of entries.
 * For Format 3, also computes the corresponding NO BOX number (global seq)
 * for each per-DO BOX number.
 *
 * @param {import('../parsers/packingListParser').ParsedItem[]} items
 * @param {boolean} resetBoxPerDo
 * @returns {Map<string, Array<{ item: Object, qtyInBox: number, boxNo: number, noBoxNo: number|null }>>}
 */
function groupItemsByBox(items, resetBoxPerDo = false) {
  /** @type {Map<string, Array>} */
  const boxMap = new Map();

  for (const item of items) {
    const noBoxRaw = item.no_box_raw !== undefined ? item.no_box_raw : item.noBoxRaw;
    const boxRaw   = item.box_raw    !== undefined ? item.box_raw    : item.boxRaw;    // Format 3 only
    const itemNoDo = item.no_do      !== undefined ? item.no_do      : item.noDo;

    const isFormat3 = boxRaw !== null && boxRaw !== undefined && boxRaw !== '';

    // Format 3: split by BOX column; Format 1/2: split by NO BOX column
    const splitRaw = isFormat3 ? boxRaw : noBoxRaw;
    const splits   = splitQtyAcrossBoxes(item.qty, splitRaw);

    // For Format 3: pre-parse both BOX and NO BOX ranges to map by position index
    const boxNumbers   = isFormat3 ? parseBoxRange(boxRaw)   : [];
    const noBoxNumbers = isFormat3 ? parseBoxRange(noBoxRaw) : [];

    for (const { boxNo, qtyInBox } of splits) {
      const key = (resetBoxPerDo && itemNoDo) ? `${itemNoDo}_${boxNo}` : `global_${boxNo}`;
      if (!boxMap.has(key)) boxMap.set(key, []);

      // For Format 3: find the corresponding NO BOX number by position index
      let noBoxNo = null;
      if (isFormat3) {
        const idx = boxNumbers.indexOf(boxNo);
        noBoxNo = (idx !== -1 && noBoxNumbers[idx] !== undefined) ? noBoxNumbers[idx] : boxNo;
      }

      boxMap.get(key).push({ item, qtyInBox, boxNo, noBoxNo });
    }
  }

  // Sort by item occurrence order (rowIndex/id), then by boxNo
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
 * Header logic:
 *   Format 1 (no NO DO, no BOX col) → "CUSTOMER , NO BOX X"
 *   Format 2 (has NO DO, no BOX col) → "CUSTOMER , NO DO/BOX : XXXX/X"
 *   Format 3 (has NO DO + BOX col)   → "CUSTOMER , NO BOX X" (global NO BOX)
 *                                       + footer: "NO DO / BOX : XXXX / X"
 *
 * @param {Object[]} items
 * @param {string}   customerName
 * @param {string}   checkerName
 * @param {boolean}  resetBoxPerDo
 * @returns {Array<LabelData>}
 *
 * @typedef {Object} LabelData
 * @property {number}   boxNo
 * @property {number|null} noBoxNo    Global NO BOX number (Format 3 only)
 * @property {string|null} noDo       e.g. "5993" — only set for Format 3 (triggers footer)
 * @property {string}   customerName
 * @property {string}   checkerName
 * @property {string}   headerText
 * @property {number}   weightKg
 * @property {Object[]} lineItems
 */
function buildLabels(items, customerName, checkerName, resetBoxPerDo = false) {
  const boxMap = groupItemsByBox(items, resetBoxPerDo);
  const labels = [];
  const ITEMS_PER_LABEL = 15;

  for (const [key, entries] of boxMap) {
    const boxNo   = entries[0].boxNo;
    // noBoxNo: global NO BOX number for Format 3 (from NO BOX column)
    const noBoxNo = entries[0].noBoxNo; // null for Format 1/2

    let noDo      = null;
    let isFormat3 = false;

    for (const entry of entries) {
      const itemNoDo   = entry.item.no_do    !== undefined ? entry.item.no_do    : entry.item.noDo;
      const itemBoxRaw = entry.item.box_raw  !== undefined ? entry.item.box_raw  : entry.item.boxRaw;
      if (itemBoxRaw !== null && itemBoxRaw !== undefined && itemBoxRaw !== '') {
        isFormat3 = true;
      }
      if (itemNoDo && !noDo) {
        noDo = itemNoDo;
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
      const partSuffix  = pageCount > 1 ? ` (${pageIdx + 1}/${pageCount})` : '';

      let headerText;
      if (isFormat3) {
        // Format 3: header pakai NO BOX (global seq dari kolom NO BOX)
        //           footer akan tampilkan NO DO / BOX : noDo / boxNo
        const displayNoBox = noBoxNo !== null && noBoxNo !== undefined ? noBoxNo : boxNo;
        headerText = `${customerName.toUpperCase()} , NO BOX ${displayNoBox}${partSuffix}`;
      } else if (noDo) {
        // Format 2: NO DO dan NO BOX masuk ke header sebagai "NO DO/BOX : X/Y"
        headerText = `${customerName.toUpperCase()} , NO DO/BOX : ${noDo}/${boxNo}${partSuffix}`;
      } else {
        // Format 1: hanya customer dan NO BOX
        headerText = `${customerName.toUpperCase()} , NO BOX ${boxNo}${partSuffix}`;
      }

      labels.push({
        boxNo,
        noBoxNo: noBoxNo || null,
        // noDo hanya di-set untuk Format 3 → memicu tampilnya footer "NO DO / BOX"
        noDo: isFormat3 ? (noDo || null) : null,
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
