import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Pin, Trash2, MessageSquare } from 'lucide-react';

export default function PostDetails() {
  const { id } = useParams(); // Get post ID from URL
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      const postRes = await API.get(`/posts/${id}`);
      setPost(postRes.data);
      
      const commentsRes = await API.get(`/posts/${id}/comments`);
      setComments(commentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`/posts/${id}/comments`, { body: newComment });
      setComments([res.data, ...comments]); // Add to top
      setNewComment("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete");
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      const res = await API.put(`/comments/${commentId}/pin`);
      // Toggle the pinned state in the UI
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, is_pinned: !c.is_pinned } : c
      ));
    } catch (err) {
      alert(err.response?.data?.detail || "Only the post owner can pin comments");
    }
  };

  const handleToggleComments = async () => {
    try {
      const res = await API.put(`/posts/${id}/allow-comments`);
      setPost({ ...post, allow_comments: !post.allow_comments });
    } catch (err) {
      alert(err.response?.data?.detail || "Not authorized");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!post) return <p className="text-center mt-10">Post not found.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-brand mb-4 font-medium">
        <ArrowLeft size={18} className="mr-1" /> Back to Feed
      </button>

      {/* Main Post */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold mb-2">{post.username}</h2>
          {/* Only Post Owner or Admin can toggle comments */}
          {(user?.id === post.user_id || user?.role === 'admin') && (
            <button onClick={handleToggleComments} className="text-sm text-brand hover:underline">
              {post.allow_comments ? "Disable Comments" : "Enable Comments"}
            </button>
          )}
        </div>
        <p className="text-gray-800 text-lg mb-4">{post.body}</p>
      </div>

      {/* Add Comment Form */}
      {post.allow_comments ? (
        user ? (
          <form onSubmit={handleAddComment} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button type="submit" className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">
              Reply
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-500 mb-6">Log in to comment.</p>
        )
      ) : (
        <p className="text-center text-red-500 font-medium mb-6 bg-red-50 p-3 rounded-lg">Comments are disabled for this post.</p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className={`p-4 rounded-lg border ${comment.is_pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-gray-800">{comment.username}</span>
                <span className="text-xs text-gray-500 ml-2">{new Date(comment.created_at).toLocaleDateString()}</span>
                {comment.is_pinned && <span className="ml-2 text-xs font-bold text-yellow-600 bg-yellow-200 px-2 py-1 rounded">PINNED</span>}
              </div>
              
              <div className="flex gap-3">
                {/* Pin Button (Only Post Owner) */}
                {user?.id === post.user_id && (
                  <button onClick={() => handlePinComment(comment.id)} className={`${comment.is_pinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}>
                    <Pin size={16} />
                  </button>
                )}
                {/* Delete Button (Comment Author, Post Owner, or Admin) */}
                {(user?.id === comment.user_id || user?.id === post.user_id || user?.role === 'admin') && (
                  <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 mt-2">{comment.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}