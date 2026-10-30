import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <-- Add to imports


export default function Profile() {
  const { user } = useContext(AuthContext);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      const res = await API.get('/users/me/posts');
      setMyPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
// Inside the component:
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleDeleteFromUI = (postId) => {
    setMyPosts(myPosts.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand text-white rounded-full flex items-center justify-center">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{user?.username}</h1>
          <p className="text-gray-500">Your Posts</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Loading your posts...</p>
      ) : myPosts.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">You haven't posted anything yet.</p>
      ) : (
        myPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onDelete={handleDeleteFromUI} 
          />
        ))
      )}
    </div>
  );
}