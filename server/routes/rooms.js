const express = require('express');
const jwt = require('jsonwebtoken');
const { sql } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function isAdminRequest(req) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return false;
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

// GET /rooms — guests see active rooms; admins with ?include_inactive=true see all
router.get('/', async (req, res) => {
  const { check_in, check_out, type } = req.query;
  const includeInactive = req.query.include_inactive === 'true' && isAdminRequest(req);
  const typeFilter = type || null;

  let rooms;

  if (check_in && check_out) {
    if (includeInactive) {
      rooms = await sql`
        SELECT r.* FROM rooms r
        WHERE (${typeFilter} IS NULL OR r.type = ${typeFilter})
          AND r.id NOT IN (
            SELECT room_id FROM reservations
            WHERE status != 'cancelled'
              AND check_in < ${check_out}
              AND check_out > ${check_in}
          )
        ORDER BY r.is_active DESC, r.price_per_night
      `;
    } else {
      rooms = await sql`
        SELECT r.* FROM rooms r
        WHERE r.is_active = TRUE
          AND (${typeFilter} IS NULL OR r.type = ${typeFilter})
          AND r.id NOT IN (
            SELECT room_id FROM reservations
            WHERE status != 'cancelled'
              AND check_in < ${check_out}
              AND check_out > ${check_in}
          )
        ORDER BY r.price_per_night
      `;
    }
  } else {
    if (includeInactive) {
      rooms = await sql`
        SELECT * FROM rooms
        WHERE (${typeFilter} IS NULL OR type = ${typeFilter})
        ORDER BY is_active DESC, price_per_night
      `;
    } else {
      rooms = await sql`
        SELECT * FROM rooms
        WHERE is_active = TRUE
          AND (${typeFilter} IS NULL OR type = ${typeFilter})
        ORDER BY price_per_night
      `;
    }
  }

  res.json(rooms);
});

// GET /rooms/:id
router.get('/:id', async (req, res) => {
  const [room] = await sql`SELECT * FROM rooms WHERE id = ${req.params.id}`;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// POST /rooms — admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { room_number, type, description, price_per_night, capacity } = req.body;
  if (!room_number || !type || !price_per_night) {
    return res.status(400).json({ error: 'room_number, type, and price_per_night are required' });
  }
  try {
    const [room] = await sql`
      INSERT INTO rooms (room_number, type, description, price_per_night, capacity)
      VALUES (${room_number}, ${type}, ${description ?? null}, ${price_per_night}, ${capacity ?? 2})
      RETURNING *
    `;
    res.status(201).json(room);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Room number already exists' });
    throw err;
  }
});

// PUT /rooms/:id — admin only
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { type, description, price_per_night, capacity, is_active } = req.body;
  const [room] = await sql`
    UPDATE rooms SET
      type = COALESCE(${type ?? null}, type),
      description = COALESCE(${description ?? null}, description),
      price_per_night = COALESCE(${price_per_night ?? null}, price_per_night),
      capacity = COALESCE(${capacity ?? null}, capacity),
      is_active = COALESCE(${is_active ?? null}, is_active)
    WHERE id = ${req.params.id}
    RETURNING *
  `;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// PATCH /rooms/:id/toggle — admin only (toggle active/inactive)
router.patch('/:id/toggle', authenticate, requireAdmin, async (req, res) => {
  const [room] = await sql`
    UPDATE rooms SET is_active = NOT is_active WHERE id = ${req.params.id} RETURNING *
  `;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// DELETE /rooms/:id — admin only (soft delete / deactivate)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const [room] = await sql`UPDATE rooms SET is_active = FALSE WHERE id = ${req.params.id} RETURNING id`;
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ message: 'Room deactivated' });
});

module.exports = router;
