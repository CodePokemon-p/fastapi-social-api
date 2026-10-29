import axios from 'axios';

// Point this to your FastAPI server
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000', 
});

// Automatically attach the token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;