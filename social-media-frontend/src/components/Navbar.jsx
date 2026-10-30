import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-brand">
          SocialApp
        </Link>

        <div className="flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-brand flex items-center gap-1">
            <Home size={20} /> Feed
          </Link>
          
          {/* ONLY SHOW ADMIN LINK IF ROLE IS ADMIN */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-gray-600 hover:text-brand flex items-center gap-1 font-bold">
              <Shield size={20} className="text-red-500" /> Admin
            </Link>
          )}

          {user ? (
            <>
              <Link to="/profile" className="text-gray-600 hover:text-brand flex items-center gap-1">
                <User size={20} /> {user.username}
              </Link>
              <button 
                onClick={handleLogout} 
                className="text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <LogOut size={20} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-brand font-medium">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}