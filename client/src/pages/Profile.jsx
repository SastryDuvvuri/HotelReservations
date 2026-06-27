import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, token, login } = useAuth();

  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [nameMsg, setNameMsg] = useState({ text: '', type: '' });
  const [nameLoading, setNameLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });
  const [pwLoading, setPwLoading] = useState(false);

  async function handleNameSubmit(e) {
    e.preventDefault();
    if (!nameForm.name.trim()) return;
    setNameMsg({ text: '', type: '' });
    setNameLoading(true);
    try {
      const updated = await api.updateProfile({ name: nameForm.name }, token);
      login(updated, token);
      setNameMsg({ text: 'Name updated successfully', type: 'success' });
    } catch (err) {
      setNameMsg({ text: err.message, type: 'error' });
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMsg({ text: '', type: '' });
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (pwForm.new_password.length < 6) {
      setPwMsg({ text: 'New password must be at least 6 characters', type: 'error' });
      return;
    }
    setPwLoading(true);
    try {
      await api.updateProfile({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      }, token);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPwMsg({ text: 'Password changed successfully', type: 'success' });
    } catch (err) {
      setPwMsg({ text: err.message, type: 'error' });
    } finally {
      setPwLoading(false);
    }
  }

  const setPw = (f) => (e) => setPwForm(p => ({ ...p, [f]: e.target.value }));

  return (
    <div className="page">
      <h1>My Profile</h1>

      <div className="profile-layout">
        <div className="profile-info-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-meta">
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>
            <span className={`badge ${user?.role === 'admin' ? 'badge-blue' : 'badge-grey'}`}>
              {user?.role}
            </span>
          </div>
          <div className="profile-joined">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>

        <div className="profile-forms">
          <div className="profile-form-card">
            <h3>Update Name</h3>
            {nameMsg.text && (
              <div className={`alert alert-${nameMsg.type}`}>{nameMsg.text}</div>
            )}
            <form onSubmit={handleNameSubmit} className="form">
              <div className="form-group">
                <label>Full name</label>
                <input
                  value={nameForm.name}
                  onChange={e => setNameForm({ name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email address</label>
                <input value={user?.email || ''} disabled />
              </div>
              <button type="submit" className="btn btn-primary" disabled={nameLoading}>
                {nameLoading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="profile-form-card">
            <h3>Change Password</h3>
            {pwMsg.text && (
              <div className={`alert alert-${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <form onSubmit={handlePasswordSubmit} className="form">
              <div className="form-group">
                <label>Current password</label>
                <input type="password" value={pwForm.current_password} onChange={setPw('current_password')}
                  placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input type="password" value={pwForm.new_password} onChange={setPw('new_password')}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="form-group">
                <label>Confirm new password</label>
                <input type="password" value={pwForm.confirm_password} onChange={setPw('confirm_password')}
                  placeholder="Repeat new password" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? 'Changing…' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
