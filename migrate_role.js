'use strict';
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await conn.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'checker' AFTER name");
    console.log('✅ Column `role` added.');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column `role` already exists, skipping.');
    } else {
      throw e;
    }
  }

  await conn.execute("UPDATE users SET role = 'admin' WHERE email = 'admin@printlabel.com'");
  console.log('✅ Admin role set.');

  const [rows] = await conn.execute('SELECT id, name, email, role FROM users');
  console.log('Current users:', JSON.stringify(rows, null, 2));

  await conn.end();
  console.log('Done!');
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
