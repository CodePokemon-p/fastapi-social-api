import { useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0); // NEW: For pagination
  const [hasMore, setHasMore] = useState(true); // NEW: Checks if there are more posts

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (isLoadMore = false) => {
    try {
      const currentSkip = isLoadMore ? skip : 0;
      // Fetch 5 posts at a time
      const res = await API.get(`/posts?skip=${currentSkip}&limit=5`);
      
      if (res.data.length < 5) setHasMore(false);
      
      if (isLoadMore) {
        setPosts([...posts, ...res.data]);
        setSkip(currentSkip + 5);
      } else {
        setPosts(res.data);
        setSkip(5);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      const res = await API.post('/posts', { body: newPost });
      setPosts([res.data, ...posts]);
      setNewPost("");
    } catch (err) { alert("Failed to create post"); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {user && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              rows="3"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
                Post
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No posts yet. Be the first to post!</p>
      ) : (
        <>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} />
          ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6 mb-10">
              <button 
                onClick={() => fetchPosts(true)} 
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Load More Posts
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}