import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ loggedIn: true, username: payload.sub, id: payload.id, role: payload.role });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await API.post('/login', formData);
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    
    // Decode immediately on login
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ loggedIn: true, username: payload.sub, id: payload.id, role: payload.role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};