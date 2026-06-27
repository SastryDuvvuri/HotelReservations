import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_ROOM = { room_number: '', type: 'single', description: '', price_per_night: '', capacity: 2 };

const ROLE_BADGE = { admin: 'badge-blue', guest: 'badge-grey' };

export default function Admin() {
  const { token, user: currentUser } = useAuth();
  const [tab, setTab] = useState('rooms');

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState(EMPTY_ROOM);
  const [editingId, setEditingId] = useState(null);
  const [roomError, setRoomError] = useState('');
  const [roomSuccess, setRoomSuccess] = useState('');

  // Reservations state
  const [reservations, setReservations] = useState([]);

  // Users state
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  async function loadRooms() {
    const data = await api.getAllRooms(token);
    setRooms(data);
  }
  async function loadReservations() {
    const data = await api.getReservations(token);
    setReservations(data);
  }
  async function loadUsers() {
    const data = await api.getUsers(token);
    setUsers(data);
  }

  useEffect(() => {
    Promise.all([loadRooms(), loadReservations(), loadUsers()]).finally(() => setLoading(false));
  }, []);

  const setField = (f) => (e) => setRoomForm(r => ({ ...r, [f]: e.target.value }));

  async function handleRoomSubmit(e) {
    e.preventDefault();
    setRoomError(''); setRoomSuccess('');
    try {
      if (editingId) {
        await api.updateRoom(editingId, roomForm, token);
        setRoomSuccess('Room updated successfully');
      } else {
        await api.createRoom(roomForm, token);
        setRoomSuccess('Room added successfully');
      }
      setRoomForm(EMPTY_ROOM);
      setEditingId(null);
      await loadRooms();
    } catch (err) {
      setRoomError(err.message);
    }
  }

  function startEdit(room) {
    setRoomForm({
      room_number: room.room_number,
      type: room.type,
      description: room.description || '',
      price_per_night: room.price_per_night,
      capacity: room.capacity,
    });
    setEditingId(room.id);
    setRoomError(''); setRoomSuccess('');
    window.scrollTo(0, 0);
  }

  async function handleToggleRoom(id) {
    try {
      const updated = await api.toggleRoom(id, token);
      setRooms(rs => rs.map(r => r.id === id ? updated : r));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteRes(id) {
    if (!confirm('Permanently delete this reservation?')) return;
    try {
      await api.deleteReservation(id, token);
      setReservations(rs => rs.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCancelRes(id) {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await api.cancelReservation(id, token);
      setReservations(rs => rs.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const updated = await api.updateUserRole(userId, newRole, token);
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: updated.role } : u));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Delete this user and all their reservations?')) return;
    try {
      await api.deleteUser(userId, token);
      setUsers(us => us.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="page"><div className="page-loading">Loading dashboard…</div></div>;

  const activeRooms = rooms.filter(r => r.is_active).length;
  const confirmedRes = reservations.filter(r => r.status === 'confirmed').length;
  const totalRevenue = reservations
    .filter(r => r.status !== 'cancelled')
    .reduce((sum, r) => sum + parseFloat(r.total_price || 0), 0);

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{rooms.length}</div>
          <div className="stat-label">Total Rooms</div>
          <div className="stat-sub">{activeRooms} active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reservations.length}</div>
          <div className="stat-label">Reservations</div>
          <div className="stat-sub">{confirmedRes} confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Users</div>
          <div className="stat-sub">{users.filter(u => u.role === 'admin').length} admins</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${totalRevenue.toFixed(0)}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-sub">excl. cancelled</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab ${tab === 'rooms' ? 'active' : ''}`} onClick={() => setTab('rooms')}>
          Rooms ({rooms.length})
        </button>
        <button className={`tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
          Reservations ({reservations.length})
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users ({users.length})
        </button>
      </div>

      {tab === 'rooms' && (
        <div className="admin-layout">
          <div className="admin-form-card">
            <h3>{editingId ? 'Edit Room' : 'Add New Room'}</h3>
            {roomError && <div className="alert alert-error">{roomError}</div>}
            {roomSuccess && <div className="alert alert-success">{roomSuccess}</div>}
            <form onSubmit={handleRoomSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label>Room number</label>
                  <input value={roomForm.room_number} onChange={setField('room_number')}
                    placeholder="101" required disabled={!!editingId} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={roomForm.type} onChange={setField('type')}>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={roomForm.description} onChange={setField('description')}
                  placeholder="Cozy room with city view" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price / night ($)</label>
                  <input type="number" value={roomForm.price_per_night} onChange={setField('price_per_night')}
                    placeholder="149" required min="1" />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input type="number" value={roomForm.capacity} onChange={setField('capacity')}
                    min="1" max="10" required />
                </div>
              </div>
              <div className="form-row">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Room' : 'Add Room'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-outline"
                    onClick={() => { setEditingId(null); setRoomForm(EMPTY_ROOM); setRoomError(''); setRoomSuccess(''); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-table-card">
            <h3>All Rooms</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Type</th><th>Description</th><th>Price</th><th>Cap.</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.6 }}>
                    <td><strong>{r.room_number}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                    <td><small>{r.description || '—'}</small></td>
                    <td>${parseFloat(r.price_per_night).toFixed(0)}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <span className={`badge ${r.is_active ? 'badge-green' : 'badge-red'}`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(r)}>Edit</button>
                      <button
                        className={`btn btn-sm ${r.is_active ? 'btn-danger' : 'btn-outline'}`}
                        onClick={() => handleToggleRoom(r.id)}>
                        {r.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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
            <thead>
              <tr>
                <th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th>
                <th>Guests</th><th>Total</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id}>
                  <td>
                    <div>{r.guest_name}</div>
                    <small>{r.guest_email}</small>
                  </td>
                  <td>Room {r.room_number} <small>({r.room_type})</small></td>
                  <td>{r.check_in?.split('T')[0]}</td>
                  <td>{r.check_out?.split('T')[0]}</td>
                  <td>{r.guests}</td>
                  <td>${parseFloat(r.total_price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${r.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleCancelRes(r.id)}>Cancel</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRes(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-table-card">
          <h3>All Users</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Bookings</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.id === currentUser?.id && <small style={{ color: 'var(--brand)', marginLeft: 6 }}>(you)</small>}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-grey'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.reservation_count}</td>
                  <td><small>{new Date(u.created_at).toLocaleDateString()}</small></td>
                  <td>
                    {u.id !== currentUser?.id && (
                      <>
                        <button className="btn btn-outline btn-sm"
                          onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'guest' : 'admin')}>
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
