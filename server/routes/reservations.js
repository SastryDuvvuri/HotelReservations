const express = require('express');
const { sql } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /reservations — user sees own, admin sees all
router.get('/', authenticate, async (req, res) => {
  const reservations = req.user.role === 'admin'
    ? await sql`
        SELECT r.*, u.name AS guest_name, u.email AS guest_email,
               rm.room_number, rm.type AS room_type
        FROM reservations r
        JOIN users u ON u.id = r.user_id
        JOIN rooms rm ON rm.id = r.room_id
        ORDER BY r.created_at DESC
      `
    : await sql`
        SELECT r.*, rm.room_number, rm.type AS room_type, rm.price_per_night
        FROM reservations r
        JOIN rooms rm ON rm.id = r.room_id
        WHERE r.user_id = ${req.user.id}
        ORDER BY r.created_at DESC
      `;
  res.json(reservations);
});

// GET /reservations/:id
router.get('/:id', authenticate, async (req, res) => {
  const [res_] = await sql`
    SELECT r.*, rm.room_number, rm.type AS room_type, rm.price_per_night,
           u.name AS guest_name, u.email AS guest_email
    FROM reservations r
    JOIN rooms rm ON rm.id = r.room_id
    JOIN users u ON u.id = r.user_id
    WHERE r.id = ${req.params.id}
  `;
  if (!res_) return res.status(404).json({ error: 'Reservation not found' });
  if (req.user.role !== 'admin' && res_.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(res_);
});

// POST /reservations
router.post('/', authenticate, async (req, res) => {
  const { room_id, check_in, check_out, guests } = req.body;
  if (!room_id || !check_in || !check_out) {
    return res.status(400).json({ error: 'room_id, check_in, and check_out are required' });
  }
  if (new Date(check_out) <= new Date(check_in)) {
    return res.status(400).json({ error: 'check_out must be after check_in' });
  }

  // Check room exists and is active
  const [room] = await sql`SELECT * FROM rooms WHERE id = ${room_id} AND is_active = TRUE`;
  if (!room) return res.status(404).json({ error: 'Room not found or unavailable' });

  // Check for conflicts
  const [conflict] = await sql`
    SELECT id FROM reservations
    WHERE room_id = ${room_id}
      AND status != 'cancelled'
      AND check_in < ${check_out}
      AND check_out > ${check_in}
  `;
  if (conflict) return res.status(409).json({ error: 'Room is not available for the selected dates' });

  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000);
  const total_price = (nights * parseFloat(room.price_per_night)).toFixed(2);

  const [reservation] = await sql`
    INSERT INTO reservations (user_id, room_id, check_in, check_out, guests, total_price)
    VALUES (${req.user.id}, ${room_id}, ${check_in}, ${check_out}, ${guests ?? 1}, ${total_price})
    RETURNING *
  `;
  res.status(201).json({ ...reservation, room_number: room.room_number, room_type: room.type });
});

// PATCH /reservations/:id/cancel
router.patch('/:id/cancel', authenticate, async (req, res) => {
  const [existing] = await sql`SELECT * FROM reservations WHERE id = ${req.params.id}`;
  if (!existing) return res.status(404).json({ error: 'Reservation not found' });
  if (req.user.role !== 'admin' && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (existing.status === 'cancelled') {
    return res.status(400).json({ error: 'Reservation is already cancelled' });
  }
  const [updated] = await sql`
    UPDATE reservations SET status = 'cancelled' WHERE id = ${req.params.id} RETURNING *
  `;
  res.json(updated);
});

// DELETE /reservations/:id — admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const [deleted] = await sql`DELETE FROM reservations WHERE id = ${req.params.id} RETURNING id`;
  if (!deleted) return res.status(404).json({ error: 'Reservation not found' });
  res.json({ message: 'Reservation deleted' });
});

module.exports = router;
