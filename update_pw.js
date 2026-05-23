const { pool } = require('./src/database/db');
const hash = '$2b$10$uTiAK7KrDevuwDxJeAVIzOzkOrYpFLA7I4Ir1btHGh/l2e1AjN1s2';
pool.execute('UPDATE users SET password = ?', [hash])
  .then(() => {
    console.log('Passwords updated to password123 successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
