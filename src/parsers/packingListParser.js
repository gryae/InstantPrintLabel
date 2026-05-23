'use strict';
const ExcelJS = require('exceljs');

/**
 * Column header names we expect in the PACKINGLIST sheet (case-insensitive, trimmed).
 * We detect column positions dynamically so the sheet can have extra columns.
 *
 * IMPORTANT: Order matters — weightKg is checked before totalWeight.
 * The `findHeaderRow` function assigns the FIRST match per field,
 * so more specific aliases go first.
 */
const EXPECTED_HEADERS = {
  code:        ['code'],
  description: ['desc', 'description'],
  qty:         ['qty', 'quantity'],
  noDo:        ['no do', 'no.do', 'no_do', 'nodo'],
  // Format 3: kolom BOX (per-DO box number) terpisah dari NO BOX (global seq)
  box:         ['box'],
  noBox:       ['no box', 'no.box', 'no_box', 'nobox'],
  qtyOfBox:    ['qty of box', 'qty_of_box', 'qtyofbox', 'qty box'],
  pCm:         ['p(cm)', 'p (cm)', 'p cm'],
  lCm:         ['l(cm)', 'l (cm)', 'l cm'],
  tCm:         ['t(cm)', 't (cm)', 't cm'],
  volumeM3:    ['volume(m3)', 'volume (m3)', 'volume m3', 'volume'],
  // More specific pattern to avoid matching plain "weight"
  weightKg:    ['weight(kg)', 'weight (kg)', 'weight kg', 'berat(kg)', 'berat'],
  // totalWeight: only assigned if weightKg column is already taken
  totalWeight: ['total weight', 'total_weight'],
};

/**
 * Resolve the actual value of a cell, following merged-cell master references.
 * ExcelJS exposes cell.master for cells that are part of a merge.
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {number} row   1-indexed
 * @param {number} col   1-indexed
 * @returns {*}
 */
function getCellValue(worksheet, row, col) {
  const cell = worksheet.getCell(row, col);
  // If this cell is part of a merge, use the master cell's value
  const master = cell.master !== cell ? cell.master : cell;
  const val = master.value;
  if (val === null || val === undefined) return null;
  // Handle rich text objects
  if (typeof val === 'object' && val.richText) {
    return val.richText.map(rt => rt.text).join('').trim();
  }
  // Handle formula results
  if (typeof val === 'object' && val.result !== undefined) {
    return val.result;
  }
  return typeof val === 'string' ? val.trim() : val;
}

/**
 * Find the header row by scanning rows until we find one containing "CODE" or "DESC".
 * Returns { headerRow, colMap } where colMap maps field keys → column index (1-based).
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @returns {{ headerRow: number, colMap: Object }}
 */
function findHeaderRow(worksheet) {
  const totalRows = worksheet.rowCount;

  for (let r = 1; r <= Math.min(totalRows, 20); r++) {
    const row = worksheet.getRow(r);
    const colMap = {};
    // Track all "weight"-containing columns so we can split weightKg vs totalWeight
    const weightCols = [];

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const raw = cell.value;
      if (!raw) return;
      const text = (typeof raw === 'string' ? raw : String(raw)).toLowerCase().trim();

      // Special handling for WEIGHT columns: collect them in order
      if (text.includes('weight') || text.includes('berat')) {
        weightCols.push({ colNumber, text });
      }

      for (const [field, aliases] of Object.entries(EXPECTED_HEADERS)) {
        if (field === 'weightKg' || field === 'totalWeight') continue; // handled below
        if (aliases.some(alias => {
          // Single-word alias (no space/dot): exact match only to avoid false positives
          // e.g. alias 'box' should NOT match 'no box' or 'qty of box'
          if (!alias.includes(' ') && !alias.includes('.') && !alias.includes('(')) {
            return text === alias;
          }
          return text === alias || text.includes(alias);
        })) {
          if (!colMap[field]) {
            colMap[field] = colNumber;
          }
        }
      }
    });

    // Assign weight columns: first weight-related col → weightKg, second → totalWeight
    if (weightCols.length >= 1) {
      // Prefer columns with "(kg)" in name
      const kgCol = weightCols.find(w => w.text.includes('(kg)') || w.text.includes(' kg'));
      if (kgCol) {
        colMap.weightKg = kgCol.colNumber;
        const remaining = weightCols.filter(w => w.colNumber !== kgCol.colNumber);
        if (remaining.length > 0) colMap.totalWeight = remaining[0].colNumber;
      } else {
        colMap.weightKg   = weightCols[0].colNumber;
        if (weightCols.length > 1) colMap.totalWeight = weightCols[1].colNumber;
      }
    }

    // We need at least code + description + qty to consider this the header row
    if (colMap.code && colMap.description && colMap.qty) {
      return { headerRow: r, colMap };
    }
  }

  throw new Error(
    'Could not find header row in PACKINGLIST sheet. ' +
    'Expected columns: CODE, DESC, QTY, NO BOX, QTY OF BOX, etc.'
  );
}

/**
 * Parse a "NO BOX" string value into an array of integer box numbers.
 *
 * Examples:
 *   "1-3"  → [1, 2, 3]
 *   "5"    → [5]
 *   "10-12"→ [10, 11, 12]
 *
 * @param {string|number} raw
 * @returns {number[]}
 */
function parseBoxRange(raw) {
  if (raw === null || raw === undefined || raw === '') return [];
  const str = String(raw).trim();
  if (!str) return [];

  const rangMatch = str.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangMatch) {
    const from = parseInt(rangMatch[1]);
    const to   = parseInt(rangMatch[2]);
    const boxes = [];
    for (let i = from; i <= to; i++) boxes.push(i);
    return boxes;
  }

  const single = parseInt(str);
  if (!isNaN(single)) return [single];
  return [];
}

/**
 * Main parser function.
 * Reads the PACKINGLIST sheet from an XLSX file buffer/path,
 * normalizes merged cells, and returns an array of row objects.
 *
 * @param {string} filePath  Absolute path to the .xlsx file
 * @returns {Promise<ParsedItem[]>}
 *
 * @typedef {Object} ParsedItem
 * @property {string}  code
 * @property {string}  description
 * @property {number}  qty
 * @property {string}  noBoxRaw       e.g. "1-3" or "5" (from NO BOX column)
 * @property {string}  boxRaw         e.g. "1-3" or "4" (from BOX column, Format 3 only)
 * @property {number}  qtyOfBox
 * @property {number}  pCm
 * @property {number}  lCm
 * @property {number}  tCm
 * @property {number}  volumeM3
 * @property {number}  weightKg
 * @property {number}  totalWeight
 * @property {number}  rowIndex
 */
async function parsePackingList(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Find the PACKINGLIST sheet (try multiple name variants)
  let worksheet = null;
  const candidates = ['PACKINGLIST', 'Packing List', 'packing list', 'PACKING LIST', 'PackingList'];
  for (const name of candidates) {
    worksheet = workbook.getWorksheet(name);
    if (worksheet) break;
  }
  // Fall back: use first sheet
  if (!worksheet) {
    worksheet = workbook.worksheets[0];
  }
  if (!worksheet) {
    throw new Error('No worksheet found in the uploaded Excel file.');
  }

  const { headerRow, colMap } = findHeaderRow(worksheet);
  const totalRows = worksheet.rowCount;
  const items = [];

  // State for merging: track the last non-null values for merged columns
  const mergedState = {
    noDo:        null,
    box:         null,   // Format 3: per-DO box number
    noBox:       null,
    qtyOfBox:    null,
    pCm:         null,
    lCm:         null,
    tCm:         null,
    volumeM3:    null,
    weightKg:    null,
    totalWeight: null,
  };

  for (let r = headerRow + 1; r <= totalRows; r++) {
    const getVal = (field) => colMap[field]
      ? getCellValue(worksheet, r, colMap[field])
      : null;

    const code        = getVal('code');
    const description = getVal('description');
    const qty         = getVal('qty');

    // Skip completely empty rows or rows without a code
    if (!code && !description) continue;
    if (!code) continue;

    // For merged columns: read value, and if non-null update the running state
    const rawNoDo       = getVal('noDo');
    const rawBox        = getVal('box');    // Format 3 only (BOX column)
    const rawNoBox      = getVal('noBox');
    const rawQtyOfBox   = getVal('qtyOfBox');
    const rawPCm        = getVal('pCm');
    const rawLCm        = getVal('lCm');
    const rawTCm        = getVal('tCm');
    const rawVolumeM3   = getVal('volumeM3');
    const rawWeightKg   = getVal('weightKg');
    // totalWeight: the last column "WEIGHT" - use carefully
    // Some sheets have the second "WEIGHT" column for total
    const rawTotalWeight = getVal('totalWeight');

    if (rawNoDo       !== null && rawNoDo       !== '') mergedState.noDo       = rawNoDo;
    if (rawBox        !== null && rawBox        !== '') mergedState.box        = rawBox;
    if (rawNoBox      !== null && rawNoBox      !== '') mergedState.noBox      = rawNoBox;
    if (rawQtyOfBox   !== null && rawQtyOfBox   !== '') mergedState.qtyOfBox   = rawQtyOfBox;
    if (rawPCm        !== null && rawPCm        !== '') mergedState.pCm        = rawPCm;
    if (rawLCm        !== null && rawLCm        !== '') mergedState.lCm        = rawLCm;
    if (rawTCm        !== null && rawTCm        !== '') mergedState.tCm        = rawTCm;
    if (rawVolumeM3   !== null && rawVolumeM3   !== '') mergedState.volumeM3   = rawVolumeM3;
    if (rawWeightKg   !== null && rawWeightKg   !== '') mergedState.weightKg   = rawWeightKg;
    if (rawTotalWeight !== null && rawTotalWeight !== '') mergedState.totalWeight = rawTotalWeight;

    const noBoxRaw = mergedState.noBox !== null ? String(mergedState.noBox).trim() : '';
    const boxRaw   = mergedState.box   !== null ? String(mergedState.box).trim()   : null;
    // For grouping/splitting: Format 3 uses BOX column, others use NO BOX
    const splitRaw = boxRaw !== null ? boxRaw : noBoxRaw;
    const boxes    = parseBoxRange(splitRaw);
    const qtyNum   = parseInt(qty) || 0;

    items.push({
      code:         String(code).trim(),
      description:  description ? String(description).trim() : '',
      qty:          qtyNum,
      noDo:         mergedState.noDo !== null ? String(mergedState.noDo).trim() : null,
      boxRaw:       boxRaw,   // null if Format 1/2
      noBoxRaw:     noBoxRaw,
      qtyOfBox:     parseInt(mergedState.qtyOfBox) || (boxes.length || 1),
      pCm:          parseFloat(mergedState.pCm)        || 0,
      lCm:          parseFloat(mergedState.lCm)        || 0,
      tCm:          parseFloat(mergedState.tCm)        || 0,
      volumeM3:     parseFloat(mergedState.volumeM3)   || 0,
      weightKg:     parseFloat(mergedState.weightKg)   || 0,
      totalWeight:  parseFloat(mergedState.totalWeight) || 0,
      rowIndex:     r - headerRow,
    });
  }

  return items;
}

module.exports = { parsePackingList, parseBoxRange };
