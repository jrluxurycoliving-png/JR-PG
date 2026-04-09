import React, { createContext, useContext, useState, useEffect } from 'react';

const AppDataContext = createContext();
export const useAppData = () => useContext(AppDataContext);

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// --- Helper Functions to Generate Local Mock Data ---
const generateFloors = () => {
  const floors = [];
  for (let f = 1; f <= 7; f++) {
    const rooms = [];
    for (let r = 1; r <= 6; r++) {
      const type = r <= 2 ? 'single' : r <= 4 ? 'double' : 'triple';
      const capacity = type === 'single' ? 1 : type === 'double' ? 2 : 3;
      rooms.push({ roomId: `${f}0${r}`, type, capacity });
    }
    floors.push({ floorNumber: f, rooms });
  }
  return floors;
};

const generateTenants = () => {
  const tenants = [];
  const names = ['Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Arjun', 'Sai', 'Kiran', 'Rahul', 'Vikram', 'Anil', 'Suresh', 'Priya', 'Neha', 'Pooja', 'Anjali'];
  const rooms = ['101', '102', '103', '103', '104', '104', '105', '105', '105', '205', '205', '205', '206', '206', '206'];
  for (let i = 0; i < 15; i++) {
    tenants.push({
      id: `t-${i+1}`,
      name: names[i] + ' Kumar',
      phone: `98765430${i < 10 ? '0'+i : i}`,
      address: `10${i} Market St, Hyd`,
      aadhaar: `1234 5000 90${i < 10 ? '0'+i : i}`,
      gender: i >= 11 ? 'Female' : 'Male',
      occupation: 'IT Professional',
      pgId: 'pg-1',
      roomId: rooms[i],
      rentAmount: 12000,
      paymentCycle: i === 0 || i === 5 ? 'daily' : 'monthly',
      advancePaid: 10000,
      securityDeposit: 5000,
      joinDate: '2026-01-01',
      checkoutDate: i === 0 || i === 5 ? '2026-04-15' : '',
      lastRentPaidMonth: i % 3 === 0 ? '2026-02' : '2026-03'
    });
  }
  return tenants;
};

const initialDataMock = {
  theme: 'light',
  paymentModes: ['Cash', 'UPI', 'Bank Transfer', 'Credit Card'],
  users: [{ id: 'admin', userid: 'ramesh', password: '1234', name: 'Ramesh', role: 'Admin', brand: 'JR LUXURY' }],
  pgs: [{ id: 'pg-1', name: 'JR Luxury - HiTech City', floors: generateFloors() }],
  tenants: generateTenants(),
  transactions: []
};

export const AppDataProvider = ({ children }) => {
  const [data, setData] = useState({
    theme: localStorage.getItem('pg_theme') || 'light',
    paymentModes: [],
    users: [],
    pgs: [],
    tenants: [],
    transactions: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activePgId, setActivePgId] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.theme);
    localStorage.setItem('pg_theme', data.theme);
  }, [data.theme]);

  useEffect(() => {
    const loadAllData = async () => {
      if (APPS_SCRIPT_URL) {
        try {
          const res = await fetch(APPS_SCRIPT_URL);
          const cloudData = await res.json();
          
          let pModes = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card'];
          if (cloudData.settings && cloudData.settings.length > 0) {
             const customModes = cloudData.settings.find(s => s.id === 'default')?.paymentModes;
             if (customModes) pModes = customModes;
          }

          setData(prev => ({
            ...prev,
            paymentModes: pModes,
            users: cloudData.users?.length > 0 ? cloudData.users : initialDataMock.users,
            pgs: cloudData.pgs || [],
            tenants: cloudData.tenants || [],
            transactions: cloudData.transactions || []
          }));
          
          if (cloudData.pgs?.length > 0) setActivePgId(cloudData.pgs[0].id);
        } catch (e) {
          console.error("Error fetching from Apps Script:", e);
        }
      } else {
        const saved = localStorage.getItem('pg_management_data_v4');
        const parsed = saved ? JSON.parse(saved) : initialDataMock;
        if (!parsed.paymentModes) parsed.paymentModes = initialDataMock.paymentModes;
        if (!parsed.users || parsed.users.length === 0) parsed.users = initialDataMock.users;
        setData(parsed);
        if (parsed.pgs.length > 0) setActivePgId(parsed.pgs[0].id);
      }
      setLoading(false);
    };

    loadAllData();
  }, []);

  // Sync to localstorage if NOT using Apps script
  useEffect(() => {
    if (!APPS_SCRIPT_URL && !loading) {
      localStorage.setItem('pg_management_data_v4', JSON.stringify(data));
    }
  }, [data, loading]);

  const toggleTheme = () => {
    setData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const getActivePg = () => data.pgs.find(pg => pg.id === activePgId) || null;

  // --- API Push Helper ---
  const pushToCloud = async (sheetName, action, payload = null) => {
    if (!APPS_SCRIPT_URL) return;
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // use basic text/plain to entirely sidestep CORS preflight OPTION requests
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          sheet: sheetName,
          action: action,
          ...(payload.id && action === 'delete' ? { id: payload.id } : { data: payload })
        })
      });
    } catch (e) {
      console.error('Failed to sync to Google Sheets', e);
    }
  }

  // --- Actions ---

  const addPaymentMode = async (mode) => {
    if (data.paymentModes.includes(mode)) return;
    const newModes = [...data.paymentModes, mode];
    
    setData(prev => ({ ...prev, paymentModes: newModes }));
    await pushToCloud('Settings', 'upsertSettings', { id: 'default', paymentModes: newModes });
  };

  const deletePaymentMode = async (mode) => {
    const newModes = data.paymentModes.filter(m => m !== mode);
    setData(prev => ({ ...prev, paymentModes: newModes }));
    await pushToCloud('Settings', 'upsertSettings', { id: 'default', paymentModes: newModes });
  };

  const savePg = async (pgObj) => {
    const id = pgObj.id || `pg-${Date.now()}`;
    const payload = { id, name: pgObj.name, floors: pgObj.floors };
    
    setData(prev => {
      const exists = prev.pgs.find(p => p.id === id);
      return { ...prev, pgs: exists ? prev.pgs.map(p => p.id === id ? payload : p) : [...prev.pgs, payload] };
    });
    if (!activePgId) setActivePgId(id);

    await pushToCloud('PGs', 'upsert', payload);
  };

  const deletePg = async (pgId) => {
    setData(prev => ({ ...prev, pgs: prev.pgs.filter(p => p.id !== pgId) }));
    if (activePgId === pgId) setActivePgId(data.pgs[0]?.id || null);
    await pushToCloud('PGs', 'delete', { id: pgId });
  };

  const saveTenant = async (tenantObj) => {
    const id = tenantObj.id || `t-${Date.now()}`;
    const newTenant = { ...tenantObj, id };

    setData(prev => {
      const exists = prev.tenants.find(t => t.id === id);
      return { ...prev, tenants: exists ? prev.tenants.map(t => t.id === id ? newTenant : t) : [...prev.tenants, newTenant] };
    });
    
    await pushToCloud('Tenants', 'upsert', newTenant);
  };

  const deleteTenant = async (tenantId) => {
    setData(prev => ({ ...prev, tenants: prev.tenants.filter(t => t.id !== tenantId) }));
    await pushToCloud('Tenants', 'delete', { id: tenantId });
  };

  const addTransaction = async (tx) => {
    const id = `tx-${Date.now()}`;
    const newTx = { ...tx, id };
    
    setData(prev => {
      const newTransactions = [...prev.transactions, newTx];
      const newTenants = tx.type === 'rent' && tx.forMonth 
        ? prev.tenants.map(t => t.id === tx.tenantId ? { ...t, lastRentPaidMonth: tx.forMonth } : t)
        : prev.tenants;
      return { ...prev, transactions: newTransactions, tenants: newTenants };
    });

    await pushToCloud('Transactions', 'upsert', newTx);
    
    // update tenant row as well if rent was logged (in a real prod this could be bulk)
    if (tx.type === 'rent' && tx.forMonth) {
       const updatedTenant = data.tenants.find(t => t.id === tx.tenantId);
       if(updatedTenant) {
          await pushToCloud('Tenants', 'upsert', { ...updatedTenant, lastRentPaidMonth: tx.forMonth });
       }
    }
  };

  const saveUser = async (userObj) => {
    setData(prev => {
      const exists = prev.users.find(u => u.id === userObj.id);
      return { ...prev, users: exists ? prev.users.map(u => u.id === userObj.id ? userObj : u) : [...prev.users, userObj] };
    });
    await pushToCloud('Users', 'upsert', userObj);
  };

  const getRoomOccupants = (roomId) => {
    return data.tenants.filter(t => t.roomId === roomId && t.pgId === activePgId);
  };

  const value = {
    data, loading, activePgId, setActivePgId, activePg: getActivePg(),
    toggleTheme, addPaymentMode, deletePaymentMode, savePg, deletePg,
    saveTenant, deleteTenant, addTransaction, getRoomOccupants, saveUser
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading App Data...</div>;

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
