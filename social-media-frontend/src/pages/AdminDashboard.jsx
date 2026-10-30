import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Protect the route: If not admin, kick them out
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockToggle = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/block`);
      // Refresh list to show new blocked status
      fetchUsers(); 
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to block user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This will permanently delete the user.")) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      // Remove from UI
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || "Cannot delete user (they might have posts).");
    }
  };

  if (user?.role !== 'admin') return null; // Don't render anything while redirecting

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
        
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <ShieldAlert size={32} className="text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-3 rounded-tl-lg">ID</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 text-gray-500">#{u.id}</td>
                    <td className="p-3 font-medium text-gray-800">{u.username}</td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${u.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {u.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 flex justify-end gap-3">
                      {/* Don't let admin block/delete themselves */}
                      {u.username !== user.username && (
                        <>
                          <button 
                            onClick={() => handleBlockToggle(u.id)}
                            className={`flex items-center gap-1 text-sm font-medium ${u.is_blocked ? 'text-green-600 hover:text-green-800' : 'text-orange-500 hover:text-orange-700'}`}
                          >
                            {u.is_blocked ? <><CheckCircle size={16}/> Unblock</> : <><Ban size={16}/> Block</>}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}