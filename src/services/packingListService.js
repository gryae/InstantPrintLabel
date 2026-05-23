'use strict';
const { pool } = require('../database/db');

/**
 * Insert a new packing list record.
 * @returns {Promise<number>} insertId
 */
async function createPackingList({ filename, originalName, uploadedBy }) {
  const [result] = await pool.execute(
    'INSERT INTO packing_lists (filename, original_name, uploaded_by) VALUES (?, ?, ?)',
    [filename, originalName, uploadedBy]
  );
  return result.insertId;
}

/**
 * Bulk-insert parsed items into packing_list_items.
 * Uses a single multi-row INSERT for performance.
 *
 * @param {number} packingListId
 * @param {import('../parsers/packingListParser').ParsedItem[]} items
 */
async function insertPackingListItems(packingListId, items) {
  if (!items.length) return;

  const placeholders = items.map(() =>
    '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).join(', ');

  const values = [];
  for (const item of items) {
    values.push(
      packingListId,
      item.code,
      item.description,
      item.qty,
      item.noDo,
      item.noBoxRaw,
      item.qtyOfBox,
      item.pCm,
      item.lCm,
      item.tCm,
      item.volumeM3,
      item.weightKg,
      item.totalWeight
    );
  }

  await pool.execute(
    `INSERT INTO packing_list_items
       (packing_list_id, code, description, qty, no_do, no_box_raw, qty_of_box,
        p_cm, l_cm, t_cm, volume_m3, weight_kg, total_weight)
     VALUES ${placeholders}`,
    values
  );
}

/**
 * Get all packing lists (with uploader name), most recent first.
 */
async function getAllPackingLists() {
  const [rows] = await pool.execute(`
    SELECT
      pl.id,
      pl.filename,
      pl.original_name,
      pl.uploaded_at,
      u.name  AS uploaded_by_name,
      COUNT(DISTINCT pli.id) AS item_count,
      COUNT(DISTINCT gl.id)  AS print_count,
      MAX(CASE WHEN pli.no_do IS NOT NULL AND pli.no_do <> '' THEN 1 ELSE 0 END) AS has_no_do
    FROM packing_lists pl
    JOIN users u ON u.id = pl.uploaded_by
    LEFT JOIN packing_list_items pli ON pli.packing_list_id = pl.id
    LEFT JOIN generated_labels gl   ON gl.packing_list_id  = pl.id
    GROUP BY pl.id, pl.filename, pl.original_name, pl.uploaded_at, u.name
    ORDER BY pl.uploaded_at DESC
  `);
  return rows;
}

/**
 * Get a single packing list by ID (with uploader name).
 */
async function getPackingListById(id) {
  const [rows] = await pool.execute(`
    SELECT pl.*, u.name AS uploaded_by_name
    FROM packing_lists pl
    JOIN users u ON u.id = pl.uploaded_by
    WHERE pl.id = ?
  `, [id]);
  return rows[0] || null;
}

/**
 * Get all items for a packing list.
 */
async function getItemsByPackingListId(packingListId) {
  const [rows] = await pool.execute(
    'SELECT * FROM packing_list_items WHERE packing_list_id = ? ORDER BY id',
    [packingListId]
  );
  return rows;
}

/**
 * Delete a packing list and cascade-delete its items.
 */
async function deletePackingList(id) {
  await pool.execute('DELETE FROM packing_lists WHERE id = ?', [id]);
}

/**
 * Record a print event.
 */
async function recordPrint({ packingListId, customerName, checkerName, resetBoxPerDo }) {
  const [result] = await pool.execute(
    'INSERT INTO generated_labels (packing_list_id, customer_name, checker_name, reset_box_per_do) VALUES (?, ?, ?, ?)',
    [packingListId, customerName, checkerName, resetBoxPerDo || 0]
  );
  return result.insertId;
}

/**
 * Get print history for a packing list.
 */
async function getPrintHistory(packingListId) {
  const [rows] = await pool.execute(
    'SELECT * FROM generated_labels WHERE packing_list_id = ? ORDER BY printed_at DESC',
    [packingListId]
  );
  return rows;
}

/**
 * Get a generated label record by ID.
 */
async function getGeneratedLabelById(id) {
  const [rows] = await pool.execute(
    'SELECT gl.*, pl.id AS pl_id FROM generated_labels gl JOIN packing_lists pl ON pl.id = gl.packing_list_id WHERE gl.id = ?',
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  createPackingList,
  insertPackingListItems,
  getAllPackingLists,
  getPackingListById,
  getItemsByPackingListId,
  deletePackingList,
  recordPrint,
  getPrintHistory,
  getGeneratedLabelById,
};
