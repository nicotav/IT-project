import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import './ArticleComments.css';

const ArticleComments = ({ articleId, knowledgeAPI, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const response = await knowledgeAPI.getComments(articleId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await knowledgeAPI.addComment(articleId, {
        comment: newComment,
        parent_comment_id: replyTo
      });
      
      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await knowledgeAPI.deleteComment(articleId, commentId);
      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const getReplies = (parentId) => {
    return comments.filter(c => c.parent_comment_id === parentId);
  };

  const Comment = ({ comment, level = 0 }) => {
    const replies = getReplies(comment.id);
    const isOwn = comment.user_id === currentUser?.id;
    
    return (
      <div className={`comment ${level > 0 ? 'comment-reply' : ''}`} style={{ marginLeft: `${level * 2}rem` }}>
        <div className="comment-header">
          <div className="comment-author">
            <User size={16} />
            <span>User {comment.user_id}</span>
            <span className="comment-date">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <div className="comment-actions">
            {level < 2 && (
              <button
                className="btn-reply"
                onClick={() => {
                  setReplyTo(comment.id);
                  document.getElementById('comment-input').focus();
                }}
              >
                Reply
              </button>
            )}
            {(isOwn || currentUser?.role === 'admin') && (
              <button
                className="btn-delete"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="comment-body">
          {comment.comment}
        </div>
        
        {replies.length > 0 && (
          <div className="comment-replies">
            {replies.map(reply => (
              <Comment key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  return (
    <div className="article-comments">
      <div className="comments-header">
        <MessageCircle size={20} />
        <h3>Comments ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="comment-form">
        {replyTo && (
          <div className="reply-indicator">
            <span>Replying to comment...</span>
            <button
              type="button"
              className="cancel-reply"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}
        <div className="comment-input-wrapper">
          <textarea
            id="comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or provide feedback..."
            rows={3}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !newComment.trim()}
          >
            <Send size={16} />
            {loading ? 'Sending...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {topLevelComments.length === 0 ? (
          <div className="no-comments">
            <MessageCircle size={32} />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          topLevelComments.map(comment => (
            <Comment key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default ArticleComments;
