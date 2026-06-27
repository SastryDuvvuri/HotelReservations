const express = require('express');
const { sql } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /users — admin: list all users with reservation counts
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           COUNT(r.id)::int AS reservation_count
    FROM users u
    LEFT JOIN reservations r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  res.json(users);
});

// PATCH /users/:id/role — admin: promote/demote user
router.patch('/:id/role', authenticate, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['guest', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Role must be guest or admin' });
  }
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  const [user] = await sql`
    UPDATE users SET role = ${role} WHERE id = ${req.params.id}
    RETURNING id, name, email, role, created_at
  `;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// DELETE /users/:id — admin: remove user and all their reservations (CASCADE)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const [deleted] = await sql`DELETE FROM users WHERE id = ${req.params.id} RETURNING id`;
  if (!deleted) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});

module.exports = router;
