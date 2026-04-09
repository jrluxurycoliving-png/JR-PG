import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building, LogOut, Moon, Sun, PieChart, Settings as SettingsIcon, KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

/* ──────────────────────────────────────────────
   Password Strength Helper
────────────────────────────────────────────── */
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: 'Too short', color: '#ff3b30' },
    { label: 'Weak',      color: '#ff9500' },
    { label: 'Fair',      color: '#ffcc00' },
    { label: 'Good',      color: '#34c759' },
    { label: 'Strong',    color: '#30d158' },
  ];
  return { score, ...map[score] };
};

/* ──────────────────────────────────────────────
   Change Password Modal
────────────────────────────────────────────── */
const ChangePasswordModal = ({ user, onClose, changePassword }) => {
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);
  const [saving, setSaving]           = useState(false);

  const strength = getPasswordStrength(newPwd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate current password against the stored one
    if (String(user.password) !== String(currentPwd)) {
      setError('Current password is incorrect.');
      return;
    }
    if (newPwd.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    await changePassword(newPwd);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => onClose(), 1800);
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 44px 11px 14px',
    borderRadius: '10px',
    border: '1px solid var(--card-border)',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontSize: '15px',
  };

  const eyeStyle = {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    padding: 0,
    display: 'flex',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '420px', padding: '32px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-color), #5e5ce6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <KeyRound size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '2px' }}>Change Password</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{user?.userid}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            padding: '32px 0', color: 'var(--success)'
          }}>
            <ShieldCheck size={48} />
            <p style={{ fontWeight: '600', fontSize: '16px' }}>Password updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Current Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                  required
                  autoComplete="current-password"
                  style={inputStyle}
                />
                <button type="button" style={eyeStyle} onClick={() => setShowCurrent(v => !v)} tabIndex={-1}>
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoComplete="new-password"
                  style={inputStyle}
                />
                <button type="button" style={eyeStyle} onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Strength bar */}
              {newPwd && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '4px',
                        background: i <= strength.score ? strength.color : 'var(--card-border)',
                        transition: 'background 0.3s ease'
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '12px', color: strength.color, fontWeight: '500' }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-pwd"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                  style={{
                    ...inputStyle,
                    borderColor: confirmPwd && confirmPwd !== newPwd ? 'var(--danger)' : 'var(--card-border)'
                  }}
                />
                <button type="button" style={eyeStyle} onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPwd && confirmPwd !== newPwd && (
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '4px' }}>Passwords don't match</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'var(--danger-bg)', color: 'var(--danger)',
                padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500'
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: '140px' }}>
                {saving ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Layout
────────────────────────────────────────────── */
const Layout = ({ children }) => {
  const { user, logout, changePassword } = useAuth();
  const { data, activePgId, setActivePgId, toggleTheme } = useAppData();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container" style={{ paddingTop: '16px' }}>
          <Building size={28} color="var(--accent-color)" />
          <span className="logo-text">JR LUXURY</span>
        </div>

        <div style={{ marginBottom: '24px', padding: '0 12px' }}>
          <select
            className="pg-switcher"
            style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '8px' }}
            value={activePgId || ''}
            onChange={(e) => setActivePgId(e.target.value)}
          >
            {data.pgs.map(pg => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/tenants" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <Users size={20} /> Tenants
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <PieChart size={20} /> Reports
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <SettingsIcon size={20} /> Settings
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            className="nav-item"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', width: '100%' }}
          >
            {data.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            Toggle Theme
          </button>

          <div style={{
            padding: '12px',
            borderTop: '1px solid var(--card-border)',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* User avatar — click to open password modal */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => setShowProfile(true)}
              title="Change Password"
            >
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-color), #5e5ce6)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: '700', fontSize: '15px',
                boxShadow: '0 2px 8px rgba(0,113,227,0.35)'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Change password</p>
              </div>
            </div>
            <LogOut
              size={18}
              cursor="pointer"
              color="var(--text-secondary)"
              onClick={handleLogout}
              title="Log out"
            />
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      {showProfile && (
        <ChangePasswordModal
          user={user}
          changePassword={changePassword}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default Layout;
