import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_CLASS = { confirmed: 'badge-green', cancelled: 'badge-red', completed: 'badge-grey' };

export default function MyReservations() {
  const { token } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setReservations(await api.getReservations(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id) {
    if (!confirm('Cancel this reservation?')) return;
    setCancelling(id);
    try {
      await api.cancelReservation(id, token);
      setReservations(rs => rs.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <div className="page"><div className="page-loading">Loading reservations…</div></div>;

  return (
    <div className="page">
      <h1>My Reservations</h1>
      {error && <div className="alert alert-error">{error}</div>}
      {reservations.length === 0 ? (
        <div className="empty-state">
          <span>🛏️</span>
          <p>You have no reservations yet.</p>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map(r => (
            <div key={r.id} className={`reservation-card ${r.status === 'cancelled' ? 'cancelled' : ''}`}>
              <div className="res-header">
                <div>
                  <h3>Room {r.room_number} <span style={{textTransform:'capitalize',color:'#666',fontWeight:400}}>({r.room_type})</span></h3>
                  <span className={`badge ${STATUS_CLASS[r.status] || 'badge-grey'}`}>{r.status}</span>
                </div>
                <div className="res-price">${parseFloat(r.total_price).toFixed(2)}</div>
              </div>
              <div className="res-dates">
                <div><span>Check-in</span><strong>{r.check_in?.split('T')[0]}</strong></div>
                <div className="res-arrow">→</div>
                <div><span>Check-out</span><strong>{r.check_out?.split('T')[0]}</strong></div>
                <div><span>Guests</span><strong>{r.guests}</strong></div>
              </div>
              {r.status === 'confirmed' && new Date(r.check_in) > new Date() && (
                <div className="res-actions">
                  <button className="btn btn-danger btn-sm" disabled={cancelling === r.id}
                    onClick={() => handleCancel(r.id)}>
                    {cancelling === r.id ? 'Cancelling…' : 'Cancel Reservation'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
