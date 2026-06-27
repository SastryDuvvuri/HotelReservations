import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
    setMenuOpen(false);
  }

  const active = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/rooms" className="nav-brand">
        <span className="nav-brand-icon">🏨</span> Grand Hotel
      </Link>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/rooms" className={active('/rooms')} onClick={() => setMenuOpen(false)}>Rooms</Link>
        {user && (
          <Link to="/reservations" className={active('/reservations')} onClick={() => setMenuOpen(false)}>
            My Bookings
          </Link>
        )}
        {user?.role === 'admin' && (
          <Link to="/admin" className={active('/admin')} onClick={() => setMenuOpen(false)}>Admin</Link>
        )}

        {user ? (
          <div className="nav-user">
            <Link to="/profile" className="nav-avatar" title="My Profile" onClick={() => setMenuOpen(false)}>
              {user.name.charAt(0).toUpperCase()}
            </Link>
            <span className="nav-username">{user.name.split(' ')[0]}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
          </div>
        ) : (
          <div className="nav-user">
            <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign up</Link>
          </div>
        )}
      </div>

      <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </nav>
  );
}
