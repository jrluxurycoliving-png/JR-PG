import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, Building, LogOut, Moon, Sun, Home, CreditCard, PieChart, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

const Layout = ({ children }) => {
  const { user, logout, changePassword } = useAuth();
  const { data, activePgId, setActivePgId, toggleTheme } = useAppData();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    await changePassword(newPassword);
    alert('Password updated successfully!');
    setShowProfile(false);
    setNewPassword('');
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
          <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/tenants" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users size={20} />
            Tenants
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <PieChart size={20} />
            Reports
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <SettingsIcon size={20} />
            Settings
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={toggleTheme} className="nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', width: '100%' }}>
            {data.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            Toggle Theme
          </button>
          
          <div style={{ padding: '12px', borderTop: '1px solid var(--card-border)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowProfile(true)} title="Edit Profile">
              <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</span>
            </div>
            <LogOut size={18} cursor="pointer" color="var(--text-secondary)" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="btn btn-secondary" onClick={() => setShowProfile(false)}>Close</button>
            </div>
            <div className="modal-body">
               <form onSubmit={handleSavePassword}>
                  <div style={{ marginBottom: '16px' }}>
                     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>New Password for {user?.userid}</label>
                     <input 
                       type="password" 
                       value={newPassword} 
                       onChange={e => setNewPassword(e.target.value)} 
                       required 
                       style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                     />
                  </div>
                  <div style={{display:'flex', justifyContent:'flex-end'}}>
                    <button type="submit" className="btn btn-primary">Save Password</button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
