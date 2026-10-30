import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Pin, Trash2, Send } from 'lucide-react';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function PostCard({ post, onDelete }) {
  const { user } = useContext(AuthContext);
  
  // Like States
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);

  // Comment States
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Edit Comment States
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  const handleLike = async () => {
    if (!user) return alert("Please login to like posts");
    try {
      if (isLiked) {
        await API.delete(`/posts/${post.id}/like`);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await API.post(`/posts/${post.id}/like`);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) { 
      console.error(err.response?.data?.detail);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await API.delete(`/posts/${post.id}`);
      onDelete(post.id); 
    } catch (err) { 
      alert(err.response?.data?.detail || "Failed to delete"); 
    }
  };

  const toggleComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    setShowComments(true);
    if (comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await API.get(`/posts/${post.id}/comments`);
        setComments(res.data);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoadingComments(false); 
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await API.post(`/posts/${post.id}/comments`, { body: newComment });
      setComments([res.data, ...comments]);
      setNewComment("");
    } catch (err) { 
      alert(err.response?.data?.detail || "Failed to comment"); 
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await API.delete(`/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) { 
      alert("Failed to delete comment"); 
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      await API.put(`/comments/${commentId}/pin`);
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, is_pinned: !c.is_pinned } : c
      ));
    } catch (err) { 
      alert("Only post owner can pin"); 
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      const res = await API.put(`/comments/${commentId}`, { body: editCommentText });
      setComments(comments.map(c => c.id === commentId ? res.data : c));
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) { 
      alert("Failed to edit comment"); 
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center font-bold">
            {post.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{post.username}</h3>
            <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        {/* Delete Post Button */}
        {(user?.id === post.user_id || user?.role === 'admin') && (
          <button onClick={handleDeletePost} className="text-gray-400 hover:text-red-500">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Body */}
      <p className="text-gray-800 text-lg mb-4">{post.body}</p>

      {/* Footer Actions */}
      <div className="flex items-center gap-6 border-t pt-3">
        
        {/* LIKE BUTTON */}
        <button onClick={handleLike} className={`flex items-center gap-1 font-medium ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} /> {likeCount}
        </button>
        
        <button onClick={toggleComments} className="flex items-center gap-1 font-medium text-gray-500 hover:text-brand">
          <MessageCircle size={20} /> Comments
        </button>

        <Link to={`/post/${post.id}`} className="text-xs text-brand hover:underline ml-auto">
          View Full Post
        </Link>
      </div>

      {/* INLINE COMMENTS SECTION */}
      {showComments && (
        <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-3">
          {loadingComments ? (
            <p className="text-sm text-center text-gray-500">Loading comments...</p>
          ) : (
            <div>
              {/* Add Comment Form */}
              {post.allow_comments ? (
                user ? (
                  <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button type="submit" className="bg-brand text-white p-2 rounded-lg hover:bg-indigo-700">
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-gray-500 text-center mb-3">Log in to comment.</p>
                )
              ) : (
                <p className="text-xs text-red-500 text-center mb-3">Comments are disabled.</p>
              )}

              {/* Comments List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center">No comments yet.</p>
                )}
                
                {comments.map(comment => (
                  <div key={comment.id} className={`text-sm p-2 rounded ${comment.is_pinned ? 'bg-yellow-100 border border-yellow-200' : 'bg-white'}`}>
                    
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{comment.username}</span>
                        {comment.is_pinned && (
                          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-200 px-1 rounded">PINNED</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        {/* Edit Button (Comment Author only) */}
                        {user?.id === comment.user_id && !editingCommentId && (
                          <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.body); }} className="text-xs text-brand hover:underline">
                            Edit
                          </button>
                        )}

                        {/* Pin Button (Post Owner only) */}
                        {user?.id === post.user_id && (
                          <button onClick={() => handlePinComment(comment.id)} className={`${comment.is_pinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}>
                            <Pin size={12} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {(user?.id === comment.user_id || user?.id === post.user_id || user?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Comment Body or Edit Mode */}
                    {editingCommentId === comment.id ? (
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="text" 
                          value={editCommentText} 
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="flex-1 border p-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                        <button onClick={() => handleEditComment(comment.id)} className="bg-brand text-white px-2 py-1 rounded text-xs">
                          Save
                        </button>
                        <button onClick={() => setEditingCommentId(null)} className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-800">{comment.body}</p>
                    )}

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}