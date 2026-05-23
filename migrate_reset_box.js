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
    await conn.execute("ALTER TABLE generated_labels ADD COLUMN reset_box_per_do TINYINT(1) DEFAULT 0 AFTER checker_name");
    console.log('✅ Column `reset_box_per_do` added to `generated_labels`.');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column `reset_box_per_do` already exists, skipping.');
    } else {
      throw e;
    }
  }

  await conn.end();
  console.log('Done!');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
