import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_ROOM = { room_number: '', type: 'single', description: '', price_per_night: '', capacity: 2 };

export default function Admin() {
  const { token } = useAuth();
  const [tab, setTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadRooms() {
    const data = await api.getRooms({}, token);
    setRooms(data);
  }
  async function loadReservations() {
    const data = await api.getReservations(token);
    setReservations(data);
  }

  useEffect(() => {
    Promise.all([loadRooms(), loadReservations()]).finally(() => setLoading(false));
  }, []);

  const set = (f) => (e) => setRoomForm(r => ({ ...r, [f]: e.target.value }));

  async function handleRoomSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editingId) {
        await api.updateRoom(editingId, roomForm, token);
        setSuccess('Room updated');
      } else {
        await api.createRoom(roomForm, token);
        setSuccess('Room added');
      }
      setRoomForm(EMPTY_ROOM);
      setEditingId(null);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(room) {
    setRoomForm({ room_number: room.room_number, type: room.type, description: room.description || '', price_per_night: room.price_per_night, capacity: room.capacity });
    setEditingId(room.id);
    window.scrollTo(0, 0);
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this room?')) return;
    await api.deleteRoom(id, token);
    await loadRooms();
  }

  async function handleDeleteRes(id) {
    if (!confirm('Permanently delete this reservation?')) return;
    await api.deleteReservation(id, token);
    setReservations(rs => rs.filter(r => r.id !== id));
  }

  if (loading) return <div className="page"><div className="page-loading">Loading…</div></div>;

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <div className="admin-tabs">
        <button className={`tab ${tab === 'rooms' ? 'active' : ''}`} onClick={() => setTab('rooms')}>
          Rooms ({rooms.length})
        </button>
        <button className={`tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
          Reservations ({reservations.length})
        </button>
      </div>

      {tab === 'rooms' && (
        <div className="admin-layout">
          <div className="admin-form-card">
            <h3>{editingId ? 'Edit Room' : 'Add New Room'}</h3>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleRoomSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label>Room number</label>
                  <input value={roomForm.room_number} onChange={set('room_number')} placeholder="101" required disabled={!!editingId} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={roomForm.type} onChange={set('type')}>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={roomForm.description} onChange={set('description')} placeholder="Cozy room with city view" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price / night ($)</label>
                  <input type="number" value={roomForm.price_per_night} onChange={set('price_per_night')} placeholder="149" required min="1" />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" value={roomForm.capacity} onChange={set('capacity')} min="1" max="10" required />
                </div>
              </div>
              <div className="form-row">
                <button type="submit" className="btn btn-primary">{editingId ? 'Update Room' : 'Add Room'}</button>
                {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setRoomForm(EMPTY_ROOM); }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="admin-table-card">
            <h3>All Rooms</h3>
            <table className="data-table">
              <thead><tr><th>#</th><th>Type</th><th>Price</th><th>Cap.</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.room_number}</strong></td>
                    <td style={{textTransform:'capitalize'}}>{r.type}</td>
                    <td>${parseFloat(r.price_per_night).toFixed(0)}</td>
                    <td>{r.capacity}</td>
                    <td><span className={`badge ${r.is_active ? 'badge-green' : 'badge-red'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(r)}>Edit</button>
                      {r.is_active && <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(r.id)}>Deactivate</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reservations' && (
        <div className="admin-table-card">
          <h3>All Reservations</h3>
          <table className="data-table">
            <thead><tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id}>
                  <td><div>{r.guest_name}</div><small>{r.guest_email}</small></td>
                  <td>Room {r.room_number} <small>({r.room_type})</small></td>
                  <td>{r.check_in?.split('T')[0]}</td>
                  <td>{r.check_out?.split('T')[0]}</td>
                  <td>{r.guests}</td>
                  <td>${parseFloat(r.total_price).toFixed(2)}</td>
                  <td><span className={`badge ${r.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteRes(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
