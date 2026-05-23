'use strict';
/**
 * Migration: tambah kolom box_raw ke packing_list_items
 * Kolom ini menyimpan nilai dari kolom "BOX" di Format 3 (per-DO box number).
 * Jalankan sekali: node migrate_box_raw.js
 */
require('dotenv').config();
const { pool } = require('./src/database/db');

async function migrate() {
  try {
    await pool.execute(`
      ALTER TABLE packing_list_items
      ADD COLUMN IF NOT EXISTS box_raw VARCHAR(50) DEFAULT NULL
        COMMENT 'Format 3: per-DO box number from BOX column (separate from NO BOX)'
        AFTER no_do
    `);
    console.log('✅  Migration sukses: kolom box_raw ditambahkan ke packing_list_items.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️   Kolom box_raw sudah ada, tidak perlu migrasi.');
    } else {
      console.error('❌  Migration gagal:', err.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();
