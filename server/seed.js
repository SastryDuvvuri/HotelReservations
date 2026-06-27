require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sql, initDb } = require('./db');

async function seed() {
  await initDb();

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Admin User', 'admin@hotel.com', ${adminHash}, 'admin')
    ON CONFLICT (email) DO NOTHING
  `;

  // Guest user
  const guestHash = await bcrypt.hash('guest123', 10);
  await sql`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Jane Guest', 'jane@example.com', ${guestHash}, 'guest')
    ON CONFLICT (email) DO NOTHING
  `;

  // Rooms
  const rooms = [
    { room_number: '101', type: 'single', description: 'Cozy single room with city view', price_per_night: 89.00, capacity: 1 },
    { room_number: '102', type: 'single', description: 'Cozy single room with garden view', price_per_night: 79.00, capacity: 1 },
    { room_number: '201', type: 'double', description: 'Spacious double room with king bed', price_per_night: 149.00, capacity: 2 },
    { room_number: '202', type: 'double', description: 'Double room with balcony', price_per_night: 169.00, capacity: 2 },
    { room_number: '301', type: 'suite', description: 'Luxury suite with ocean view and jacuzzi', price_per_night: 349.00, capacity: 4 },
    { room_number: '302', type: 'suite', description: 'Executive suite with living area', price_per_night: 399.00, capacity: 4 },
  ];

  for (const room of rooms) {
    await sql`
      INSERT INTO rooms (room_number, type, description, price_per_night, capacity)
      VALUES (${room.room_number}, ${room.type}, ${room.description}, ${room.price_per_night}, ${room.capacity})
      ON CONFLICT (room_number) DO NOTHING
    `;
  }

  console.log('Seed complete!');
  console.log('  Admin: admin@hotel.com / admin123');
  console.log('  Guest: jane@example.com / guest123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
