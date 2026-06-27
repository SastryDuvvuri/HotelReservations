const BASE = '/api';

async function request(path, options = {}, token) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) => request('/auth/me', {}, token),
  updateProfile: (body, token) => request('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }, token),

  // Rooms
  getRooms: (params, token) => request(`/rooms?${new URLSearchParams(params)}`, {}, token),
  getAllRooms: (token) => request('/rooms?include_inactive=true', {}, token),
  getRoom: (id, token) => request(`/rooms/${id}`, {}, token),
  createRoom: (body, token) => request('/rooms', { method: 'POST', body: JSON.stringify(body) }, token),
  updateRoom: (id, body, token) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  toggleRoom: (id, token) => request(`/rooms/${id}/toggle`, { method: 'PATCH' }, token),
  deleteRoom: (id, token) => request(`/rooms/${id}`, { method: 'DELETE' }, token),

  // Reservations
  getReservations: (token) => request('/reservations', {}, token),
  createReservation: (body, token) => request('/reservations', { method: 'POST', body: JSON.stringify(body) }, token),
  cancelReservation: (id, token) => request(`/reservations/${id}/cancel`, { method: 'PATCH' }, token),
  deleteReservation: (id, token) => request(`/reservations/${id}`, { method: 'DELETE' }, token),

  // Users (admin)
  getUsers: (token) => request('/users', {}, token),
  updateUserRole: (id, role, token) => request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, token),
  deleteUser: (id, token) => request(`/users/${id}`, { method: 'DELETE' }, token),
};
