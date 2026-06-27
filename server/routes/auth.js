const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${hash})
      RETURNING id, name, email, role, created_at
    `;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    throw err;
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const { password_hash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
  const [user] = await sql`SELECT id, name, email, role, created_at FROM users WHERE id = ${req.user.id}`;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /auth/me — update name and/or password
router.patch('/me', authenticate, async (req, res) => {
  const { name, current_password, new_password } = req.body;

  const [user] = await sql`SELECT * FROM users WHERE id = ${req.user.id}`;
  if (!user) return res.status(404).json({ error: 'User not found' });

  let updates = {};

  if (name && name.trim()) {
    updates.name = name.trim();
  }

  if (new_password) {
    if (!current_password) {
      return res.status(400).json({ error: 'current_password is required to set a new password' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    updates.password_hash = await bcrypt.hash(new_password, 10);
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const newName = updates.name ?? user.name;
  const newHash = updates.password_hash ?? user.password_hash;

  const [updated] = await sql`
    UPDATE users SET name = ${newName}, password_hash = ${newHash}
    WHERE id = ${req.user.id}
    RETURNING id, name, email, role, created_at
  `;

  res.json(updated);
});

module.exports = router;
