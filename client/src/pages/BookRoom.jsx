import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BookRoom() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const room = state?.room;
  const [form, setForm] = useState({
    check_in: state?.check_in || '',
    check_out: state?.check_out || '',
    guests: 1,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!room) { navigate('/rooms'); return null; }

  const nights = Math.max(1, Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / 86400000));
  const total = (nights * parseFloat(room.price_per_night)).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createReservation({ room_id: room.id, ...form }, token);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h2>Booking Confirmed!</h2>
          <p>Your reservation for Room {room.room_number} has been confirmed.</p>
          <div className="booking-summary">
            <div><strong>Check-in:</strong> {form.check_in}</div>
            <div><strong>Check-out:</strong> {form.check_out}</div>
            <div><strong>Nights:</strong> {nights}</div>
            <div><strong>Total:</strong> ${total}</div>
          </div>
          <div className="success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/reservations')}>View My Bookings</button>
            <button className="btn btn-outline" onClick={() => navigate('/rooms')}>Browse More Rooms</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back to rooms</button>
      <div className="book-layout">
        <div className="book-form-card">
          <h2>Complete Your Booking</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Check-in</label>
                <input type="date" value={form.check_in}
                  onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Check-out</label>
                <input type="date" value={form.check_out} min={form.check_in}
                  onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label>Number of guests</label>
              <select value={form.guests} onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}>
                {Array.from({ length: room.capacity }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Guest name</label>
              <input value={user?.name || ''} disabled />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Booking…' : `Confirm Booking · $${total}`}
            </button>
          </form>
        </div>

        <div className="book-summary-card">
          <h3>Room {room.room_number}</h3>
          <p className="book-room-desc">{room.description}</p>
          <div className="book-details">
            <div className="book-detail-row"><span>Room type</span><strong style={{textTransform:'capitalize'}}>{room.type}</strong></div>
            <div className="book-detail-row"><span>Capacity</span><strong>Up to {room.capacity} guests</strong></div>
            <div className="book-detail-row"><span>Rate</span><strong>${parseFloat(room.price_per_night).toFixed(0)}/night</strong></div>
            <div className="book-detail-row"><span>Nights</span><strong>{nights}</strong></div>
            <div className="book-detail-row total-row"><span>Total</span><strong>${total}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
