'use strict';
const bcrypt   = require('bcryptjs');
const { pool } = require('../database/db');

const ADMIN_EMAIL = 'admin@printlabel.com';

async function index(req, res) {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id ASC'
    );
    res.render('users/index', {
      title: 'User Management — PrintLabel',
      users,
      messages: {
        success: req.flash('success'),
        error:   req.flash('error'),
      },
    });
  } catch (err) {
    console.error('Users index error:', err);
    req.flash('error', 'Failed to load users.');
    res.redirect('/packing-lists');
  }
}

function showCreate(req, res) {
  res.render('users/form', {
    title:    'Add User — PrintLabel',
    action:   '/users',
    formUser: { name: '', email: '', role: 'checker' },
    isEdit:   false,
    messages: {
      success: req.flash('success'),
      error:   req.flash('error'),
    },
  });
}

async function handleCreate(req, res) {
  const { name, email, role, password } = req.body;

  if (!name || !email || !password) {
    req.flash('error', 'Name, email, and password are required.');
    return res.redirect('/users/new');
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]
    );
    if (existing.length) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/users/new');
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), role || 'checker', hashed]
    );

    req.flash('success', `✅ User "${name}" created successfully.`);
    res.redirect('/users');
  } catch (err) {
    console.error('Create user error:', err);
    req.flash('error', 'Failed to create user: ' + err.message);
    res.redirect('/users/new');
  }
}

async function showEdit(req, res) {
  const id = parseInt(req.params.id);
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ?', [id]
    );
    if (!rows.length) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }
    res.render('users/form', {
      title:    'Edit User — PrintLabel',
      action:   `/users/${id}/edit`,
      formUser: rows[0],
      isEdit:   true,
      messages: {
        success: req.flash('success'),
        error:   req.flash('error'),
      },
    });
  } catch (err) {
    console.error('Show edit error:', err);
    req.flash('error', 'Failed to load user.');
    res.redirect('/users');
  }
}

async function handleEdit(req, res) {
  const id = parseInt(req.params.id);
  const { name, email, role, password } = req.body;

  if (!name || !email) {
    req.flash('error', 'Name and email are required.');
    return res.redirect(`/users/${id}/edit`);
  }

  try {
    // Check email not taken by someone else
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email.trim().toLowerCase(), id]
    );
    if (existing.length) {
      req.flash('error', 'Email already in use by another user.');
      return res.redirect(`/users/${id}/edit`);
    }

    if (password && password.trim()) {
      // Update with new password
      const hashed = await bcrypt.hash(password.trim(), 10);
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
        [name.trim(), email.trim().toLowerCase(), role || 'checker', hashed, id]
      );
    } else {
      // Update without changing password
      await pool.execute(
        'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
        [name.trim(), email.trim().toLowerCase(), role || 'checker', id]
      );
    }

    req.flash('success', `✅ User "${name}" updated successfully.`);
    res.redirect('/users');
  } catch (err) {
    console.error('Edit user error:', err);
    req.flash('error', 'Failed to update user: ' + err.message);
    res.redirect(`/users/${id}/edit`);
  }
}

async function handleDelete(req, res) {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.execute('SELECT email FROM users WHERE id = ?', [id]);
    if (!rows.length) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    const target = rows[0];

    // Cannot delete the admin account
    if (target.email === ADMIN_EMAIL) {
      req.flash('error', 'Cannot delete the admin account.');
      return res.redirect('/users');
    }

    // Cannot delete yourself
    if (id === req.session.user.id) {
      req.flash('error', 'Cannot delete your own account.');
      return res.redirect('/users');
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    req.flash('success', 'User deleted successfully.');
    res.redirect('/users');
  } catch (err) {
    console.error('Delete user error:', err);
    req.flash('error', 'Failed to delete user: ' + err.message);
    res.redirect('/users');
  }
}

module.exports = { index, showCreate, handleCreate, showEdit, handleEdit, handleDelete };
