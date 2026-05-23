'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'print_label',
  });

  try {
    await conn.execute("ALTER TABLE packing_list_items ADD COLUMN no_do VARCHAR(100) DEFAULT NULL AFTER qty");
    console.log('✅ Column `no_do` added to `packing_list_items`.');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column `no_do` already exists, skipping.');
    } else {
      throw e;
    }
  }

  await conn.end();
  console.log('Done!');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
