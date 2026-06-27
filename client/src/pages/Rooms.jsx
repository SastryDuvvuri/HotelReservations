import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS = { single: 'Single', double: 'Double', suite: 'Suite' };
const TYPE_ICONS = { single: '🛏️', double: '🛏️🛏️', suite: '👑' };
const TYPE_AMENITIES = {
  single: ['Free Wi-Fi', 'TV', 'Air conditioning', 'Private bathroom'],
  double: ['Free Wi-Fi', 'King bed', 'TV', 'Mini-bar', 'Balcony'],
  suite: ['Free Wi-Fi', 'King bed', 'Jacuzzi', 'Living area', 'Mini-bar', 'Ocean view'],
};

export default function Rooms() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [filters, setFilters] = useState({ check_in: today, check_out: tomorrow, type: '' });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  async function fetchRooms() {
    setLoading(true);
    setError('');
    try {
      const params = { check_in: filters.check_in, check_out: filters.check_out };
      if (filters.type) params.type = filters.type;
      const data = await api.getRooms(params, token);
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRooms(); }, []);

  const nights = Math.max(1, Math.ceil((new Date(filters.check_out) - new Date(filters.check_in)) / 86400000));

  return (
    <div className="page">
      <div className="page-hero">
        <h1>Find Your Perfect Room</h1>
        <p>Luxury stays tailored to your needs — free cancellation on most bookings</p>
      </div>

      <div className="search-bar">
        <div className="form-group">
          <label>Check-in</label>
          <input type="date" value={filters.check_in} min={today}
            onChange={e => setFilters(f => ({ ...f, check_in: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Check-out</label>
          <input type="date" value={filters.check_out} min={filters.check_in}
            onChange={e => setFilters(f => ({ ...f, check_out: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Room type</label>
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={fetchRooms}>Search</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <span>🔍</span>
          <p>No rooms available for the selected dates.<br />Try adjusting your dates or room type.</p>
        </div>
      ) : (
        <>
          <p className="results-count">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} available
            &nbsp;·&nbsp;
            {nights} night{nights !== 1 ? 's' : ''}
            &nbsp;·&nbsp;
            {filters.check_in} → {filters.check_out}
          </p>
          <div className="rooms-grid">
            {rooms.map(room => {
              const amenities = TYPE_AMENITIES[room.type] || [];
              return (
                <div key={room.id} className="room-card">
                  <div className="room-card-header" data-type={room.type}>
                    <div>
                      <span className="room-type-badge">{TYPE_LABELS[room.type] || room.type}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="room-card-icon">{TYPE_ICONS[room.type]}</div>
                      <span className="room-number">Room {room.room_number}</span>
                    </div>
                  </div>
                  <div className="room-card-body">
                    <h3>{room.description || `${TYPE_LABELS[room.type]} Room`}</h3>
                    <div className="room-amenities">
                      <span className="amenity">👥 Up to {room.capacity}</span>
                      {amenities.map(a => <span key={a} className="amenity">{a}</span>)}
                    </div>
                    <div className="room-price">
                      <span className="price">${parseFloat(room.price_per_night).toFixed(0)}</span>
                      <span className="per-night"> / night</span>
                      {nights > 1 && (
                        <span className="total-price">
                          ${(parseFloat(room.price_per_night) * nights).toFixed(0)} total for {nights} nights
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="room-card-footer">
                    <button className="btn btn-primary btn-full"
                      onClick={() => navigate(`/rooms/${room.id}/book`, {
                        state: { room, check_in: filters.check_in, check_out: filters.check_out }
                      })}>
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
