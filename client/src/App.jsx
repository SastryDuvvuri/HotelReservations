import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import BookRoom from './pages/BookRoom';
import MyReservations from './pages/MyReservations';
import Admin from './pages/Admin';

function PrivateRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/rooms" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id/book" element={
            <PrivateRoute><BookRoom /></PrivateRoute>
          } />
          <Route path="/reservations" element={
            <PrivateRoute><MyReservations /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute adminOnly><Admin /></PrivateRoute>
          } />
        </Routes>
      </main>
    </>
  );
}
