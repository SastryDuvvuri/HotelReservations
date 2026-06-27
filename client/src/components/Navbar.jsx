import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const active = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link to="/rooms" className="nav-brand">🏨 Grand Hotel</Link>
      <div className="nav-links">
        <Link to="/rooms" className={active('/rooms')}>Rooms</Link>
        {user && <Link to="/reservations" className={active('/reservations')}>My Bookings</Link>}
        {user?.role === 'admin' && <Link to="/admin" className={active('/admin')}>Admin</Link>}
        {user ? (
          <div className="nav-user">
            <span className="nav-username">{user.name}</span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">Logout</button>
          </div>
        ) : (
          <div className="nav-user">
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
