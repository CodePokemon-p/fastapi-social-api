import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when the app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you might fetch the user profile here.
      // For now, we will just decode the basic state.
      setUser({ loggedIn: true }); 
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // FastAPI OAuth2 expects Form Data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await API.post('/login', formData);
    localStorage.setItem('token', response.data.access_token);
    
    // After login, we ideally fetch the user data (like role)
    // For now, we just set a basic logged in state
    setUser({ loggedIn: true, username });
    return response.data;
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