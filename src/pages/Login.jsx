import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building } from 'lucide-react';

const Login = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(userid, password)) {
      navigate('/');
    } else {
      setError('Invalid userid or password');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-color)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--accent-color)', borderRadius: '20px', color: 'white' }}>
              <Building size={40} />
            </div>
          </div>
          <h1 className="logo-text" style={{ fontSize: '28px', marginBottom: '8px' }}>JR LUXURY</h1>
          <p className="text-secondary">Premium Paying Guest Management</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>User ID</label>
            <input 
              type="text" 
              placeholder="Enter userid" 
              value={userid}
              onChange={(e) => setUserid(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: '12px', fontSize: '16px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
