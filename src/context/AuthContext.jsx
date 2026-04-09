import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppData } from './AppDataContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { data, saveUser } = useAppData();
  
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pg_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userid, password) => {
    const foundUser = data.users.find(u => u.userid === userid && String(u.password) === String(password));
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('pg_auth_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pg_auth_user');
  };

  const changePassword = async (newPassword) => {
    if (!user) return false;
    const updatedUser = { ...user, password: newPassword };
    await saveUser(updatedUser);
    setUser(updatedUser);
    localStorage.setItem('pg_auth_user', JSON.stringify(updatedUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
