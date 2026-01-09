import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ticketAPI } from '../services/api'
import './TicketView.css'

function TicketView() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [timeLogs, setTimeLogs] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [commentVisibility, setCommentVisibility] = useState('public') // 'public' or 'private'

  useEffect(() => {
    fetchTicket()
    fetchTimeLogs()
  }, [id])

  const fetchTicket = async () => {
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      loadMockTicket()
      setLoading(false)
      return
    }

    try {
      const response = await ticketAPI.getTicket(id)
      setTicket(response.data)
      setComments(response.data.comments || [])
      setLoading(false)
    } catch (error) {
      // Silently use mock data for development
      loadMockTicket()
      setLoading(false)
    }
  }

  const loadMockTicket = () => {
    setTicket({
      id: 1,
      title: 'Email server not responding',
      description: 'Exchange server is not accepting connections. Users are unable to send or receive emails. This started approximately 30 minutes ago after the scheduled Windows updates were applied.',
      status: 'in-progress',
      priority: 'critical',
      assignee: 'John Doe',
      requester: 'Jane Smith',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 600000).toISOString(),
      sla_target: new Date(Date.now() + 7200000).toISOString(),
      time_logged: '45m',
      category: 'Email',
      tags: ['exchange', 'critical', 'outage']
    })
    setComments([
      {
        id: 1,
        author: 'John Doe',
        text: 'Investigating the issue. Checking Exchange services status.',
        created_at: new Date(Date.now() - 900000).toISOString()
      },
      {
        id: 2,
        author: 'John Doe',
        text: 'Found that the Exchange Transport service failed to start after Windows update. Attempting manual restart.',
        created_at: new Date(Date.now() - 600000).toISOString()
      }
    ])
  }

  const fetchTimeLogs = async () => {
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      loadMockTimeLogs()
      return
    }

    try {
      const response = await ticketAPI.getTimeLog(id)
      setTimeLogs(response.data)
    } catch (error) {
      // Silently use mock data for development
      loadMockTimeLogs()
    }
  }

  const loadMockTimeLogs = () => {
    setTimeLogs([
      { id: 1, user: 'John Doe', duration: '30m', description: 'Initial investigation', created_at: new Date(Date.now() - 900000).toISOString() },
      { id: 2, user: 'John Doe', duration: '15m', description: 'Service restart and testing', created_at: new Date(Date.now() - 600000).toISOString() }
    ])
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    // Check if authenticated
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Mock comment addition for demo
      const mockComment = {
        id: comments.length + 1,
        author: 'Nicolas Taveras',
        text: newComment,
        created_at: new Date().toISOString(),
        visibility: commentVisibility
      }
      setComments([...comments, mockComment])
      setNewComment('')
      setCommentVisibility('public')
      return
    }

    try {
      await ticketAPI.addComment(id, {
        comment: newComment,
        is_internal: commentVisibility === 'private'
      })
      setNewComment('')
      setCommentVisibility('public')
      fetchTicket()
    } catch (error) {
      console.error('API Error:', error)
      // Silently handle error in demo mode
      const mockComment = {
        id: comments.length + 1,
        author: 'Nicolas Taveras',
        text: newComment,
        created_at: new Date().toISOString(),
        visibility: commentVisibility
      }
      setComments([...comments, mockComment])
      setNewComment('')
      setCommentVisibility('public')
    }
  }

  const handleUpdateStatus = (newStatus) => {
    setTicket(prev => ({ ...prev, status: newStatus }))
    setShowStatusModal(false)
    alert(`Status updated to ${newStatus}!`)
  }

  const handleAddTime = (duration, description) => {
    const newTimeLog = {
      id: timeLogs.length + 1,
      user: 'Nicolas Taveras',
      duration,
      description,
      created_at: new Date().toISOString()
    }
    setTimeLogs([...timeLogs, newTimeLog])
    setShowTimeModal(false)
    alert('Time logged successfully!')
  }

  const handleReassign = (newAssignee) => {
    setTicket(prev => ({ ...prev, assignee: newAssignee }))
    setShowReassignModal(false)
    alert(`Ticket reassigned to ${newAssignee}!`)
  }

  const handleCloseTicket = () => {
    if (confirm('Are you sure you want to close this ticket?')) {
      setTicket(prev => ({ ...prev, status: 'closed' }))
      alert('Ticket closed successfully!')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc2626'
      case 'high': return '#ea580c'
      case 'medium': return '#d97706'
      case 'low': return '#16a34a'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#2563eb'
      case 'in-progress': return '#d97706'
      case 'resolved': return '#059669'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return <div className="loading">Loading ticket...</div>
  }

  return (
    <div className="ticket-view-container">
      <div className="breadcrumb">
        <Link to="/">← Back to Tickets</Link>
      </div>

      <div className="ticket-view-grid">
        <div className="ticket-main">
          <div className="ticket-card">
            <div className="ticket-header-view">
              <div className="ticket-badges">
                <span 
                  className="priority-badge-lg"
                  style={{ 
                    background: getPriorityColor(ticket.priority) + '20',
                    color: getPriorityColor(ticket.priority),
                    border: `2px solid ${getPriorityColor(ticket.priority)}`
                  }}
                >
                  {ticket.priority}
                </span>
                <span 
                  className="status-badge-lg"
                  style={{ 
                    background: getStatusColor(ticket.status) + '20',
                    color: getStatusColor(ticket.status)
                  }}
                >
                  {ticket.status}
                </span>
              </div>

              <h1>#{ticket.id} {ticket.title}</h1>

              <div className="ticket-meta">
                <span>Created by <strong>{ticket.requester}</strong></span>
                <span>•</span>
                <span>{formatDateTime(ticket.created_at)}</span>
                <span>•</span>
                <span>Category: <strong>{ticket.category}</strong></span>
              </div>

              <div className="ticket-tags">
                {ticket.tags?.map(tag => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            </div>

            <div className="ticket-body">
              <h3>Description</h3>
              <p>{ticket.description}</p>
            </div>

            <div className="ticket-actions">
              <button className="action-btn primary" onClick={() => setShowStatusModal(true)}>Update Status</button>
              <button className="action-btn" onClick={() => setShowTimeModal(true)}>Add Time</button>
              <button className="action-btn" onClick={() => setShowReassignModal(true)}>Reassign</button>
              <button className="action-btn" onClick={handleCloseTicket}>Close Ticket</button>
            </div>
          </div>

          <div className="comments-section">
            <h3>Comments & Activity</h3>
            
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-avatar">
                    {comment.author.charAt(0)}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <strong>{comment.author}</strong>
                      {comment.visibility === 'private' && (
                        <span className="privacy-badge" style={{
                          background: '#f59e0b20',
                          color: '#f59e0b',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          marginLeft: '8px'
                        }}>
                          🔒 Private
                        </span>
                      )}
                      <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows="4"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={commentVisibility === 'private'}
                    onChange={(e) => setCommentVisibility(e.target.checked ? 'private' : 'public')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: '#64748b' }}>
                    🔒 Private comment (only visible to technicians)
                  </span>
                </label>
                <button type="submit">Post Comment</button>
              </div>
            </form>
          </div>
        </div>

        <div className="ticket-sidebar">
          <div className="sidebar-card">
            <h3>Details</h3>
            <div className="detail-item">
              <span className="detail-label">Assigned To</span>
              <span className="detail-value">{ticket.assignee}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value" style={{ color: getStatusColor(ticket.status) }}>
                {ticket.status}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Priority</span>
              <span className="detail-value" style={{ color: getPriorityColor(ticket.priority) }}>
                {ticket.priority}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created</span>
              <span className="detail-value">{formatDateTime(ticket.created_at)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value">{formatDateTime(ticket.updated_at)}</span>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>SLA Status</h3>
            <div className="sla-countdown">
              <div className="sla-label">Time Remaining</div>
              <div className="sla-value">2h 15m</div>
            </div>
            <div className="sla-progress">
              <div className="sla-progress-bar" style={{ width: '65%' }}></div>
            </div>
            <div className="sla-info">
              Target: {formatDateTime(ticket.sla_target)}
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Time Tracking</h3>
            <div className="time-summary">
              <span className="time-total">{ticket.time_logged}</span>
              <span className="time-label">Total Time Logged</span>
            </div>
            <div className="time-logs">
              {timeLogs.map(log => (
                <div key={log.id} className="time-log">
                  <div className="time-log-header">
                    <strong>{log.duration}</strong>
                    <span>{log.user}</span>
                  </div>
                  <div className="time-log-desc">{log.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Update Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {['new', 'in-progress', 'pending', 'resolved', 'closed'].map(status => (
                <button 
                  key={status}
                  className="btn btn-secondary"
                  onClick={() => handleUpdateStatus(status)}
                  style={{ justifyContent: 'flex-start', textTransform: 'capitalize' }}
                >
                  {status.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Time Modal */}
      {showTimeModal && (
        <div className="modal-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Log Time</h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const duration = e.target.duration.value
              const description = e.target.description.value
              handleAddTime(duration, description)
              e.target.reset()
            }}>
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Duration</label>
                <input 
                  type="text" 
                  name="duration"
                  placeholder="e.g., 1h 30m"
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                <textarea 
                  name="description"
                  placeholder="What did you work on?"
                  required
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">Log Time</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTimeModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="modal-overlay" onClick={() => setShowReassignModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>Reassign Ticket</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {['Nicolas Taveras', 'John Doe', 'Jane Smith', 'Tech Team', 'Unassigned'].map(assignee => (
                <button 
                  key={assignee}
                  className="btn btn-secondary"
                  onClick={() => handleReassign(assignee)}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {assignee}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketView
