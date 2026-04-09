import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Settings as SettingsIcon, Trash2, Plus, Home } from 'lucide-react';
import PGManagement from './PGManagement';

const Settings = () => {
  const { data, addPaymentMode, deletePaymentMode } = useAppData();
  const [newMode, setNewMode] = useState('');
  const [activeTab, setActiveTab] = useState('payment');

  const handleAddMode = (e) => {
    e.preventDefault();
    if (newMode.trim()) {
      addPaymentMode(newMode.trim());
      setNewMode('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="text-secondary">System configurations and preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className={`btn ${activeTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('payment')}
        >
          <SettingsIcon size={16} /> Payment Config
        </button>
        <button 
          className={`btn ${activeTab === 'pg' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('pg')}
        >
          <Home size={16} /> PG Properties Setup
        </button>
      </div>

      {activeTab === 'payment' && (
        <div className="dashboard-grid">
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <SettingsIcon size={24} color="var(--accent-color)" />
              <h3 style={{ margin: 0 }}>Payment Modes</h3>
            </div>
            <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '24px' }}>
              Configure the types of payment methods accepted across all PGs. These will appear in dropdowns when logging transactions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {data.paymentModes.map(mode => (
                <div key={mode} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: '8px' 
                }}>
                  <span style={{ fontWeight: 500 }}>{mode}</span>
                  <button 
                    onClick={() => deletePaymentMode(mode)} 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMode} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="e.g. PayPal, Custom Bank" 
                value={newMode} 
                onChange={e => setNewMode(e.target.value)} 
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                <Plus size={18} /> Add
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'pg' && (
        <PGManagement />
      )}
    </div>
  );
};

export default Settings;
