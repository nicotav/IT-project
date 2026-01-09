import { useState } from 'react'
import { Globe, Plus, MessageSquare, FileText, Star, Search, Filter } from 'lucide-react'
import './CustomerPortal.css'

function CustomerPortal() {
  const [activeView, setActiveView] = useState('tickets')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewTicket, setShowNewTicket] = useState(false)

  const myTickets = [
    { id: 1001, title: 'Cannot access email', status: 'in-progress', priority: 'high', created: '2 hours ago', lastUpdate: '30 minutes ago', assignee: 'John Doe' },
    { id: 1005, title: 'Printer not working', status: 'new', priority: 'medium', created: '1 day ago', lastUpdate: '1 day ago', assignee: 'Unassigned' },
    { id: 998, title: 'Software installation request', status: 'resolved', priority: 'low', created: '3 days ago', lastUpdate: '2 hours ago', assignee: 'Jane Smith' }
  ]

  const kbArticles = [
    { id: 1, title: 'How to reset your password', category: 'Account', views: 1234 },
    { id: 2, title: 'VPN Setup Guide', category: 'Network', views: 892 },
    { id: 3, title: 'Email Configuration on Mobile', category: 'Email', views: 756 },
    { id: 4, title: 'Troubleshooting Print Issues', category: 'Hardware', views: 634 }
  ]

  return (
    <div className="customer-portal fade-in">
      <div className="portal-header card">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Globe size={28} />
            </div>
            <div>
              <h2 className="page-title">Customer Portal</h2>
              <p className="page-subtitle">Self-service support center</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>
            <Plus size={18} />
            New Ticket
          </button>
        </div>
      </div>

      <div className="portal-nav card">
        <button 
          className={`nav-btn ${activeView === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveView('tickets')}
        >
          <FileText size={18} />
          My Tickets
          <span className="nav-badge">{myTickets.length}</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveView('knowledge')}
        >
          <MessageSquare size={18} />
          Knowledge Base
        </button>
        <button 
          className={`nav-btn ${activeView === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveView('feedback')}
        >
          <Star size={18} />
          Feedback
        </button>
      </div>

      {activeView === 'tickets' && (
        <div className="portal-content">
          <div className="content-header">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search your tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn btn-ghost">
              <Filter size={18} />
              Filter
            </button>
          </div>

          <div className="tickets-list">
            {myTickets.map(ticket => (
              <div key={ticket.id} className="ticket-item card">
                <div className="ticket-header-row">
                  <span className="ticket-id">#{ticket.id}</span>
                  <div className="ticket-badges">
                    <span className={`badge badge-${ticket.status === 'resolved' ? 'success' : ticket.status === 'in-progress' ? 'warning' : 'primary'}`}>
                      {ticket.status}
                    </span>
                    <span className={`badge badge-${ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'success'}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <h3 className="ticket-title">{ticket.title}</h3>
                <div className="ticket-meta">
                  <span>Created {ticket.created}</span>
                  <span>•</span>
                  <span>Updated {ticket.lastUpdate}</span>
                  <span>•</span>
                  <span>Assigned to {ticket.assignee}</span>
                </div>
                <button className="btn btn-sm btn-secondary">View Details</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'knowledge' && (
        <div className="portal-content">
          <div className="content-header">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search knowledge base..."
                className="search-input"
              />
            </div>
          </div>

          <div className="kb-grid">
            {kbArticles.map(article => (
              <div key={article.id} className="kb-card card">
                <div className="kb-icon">
                  <FileText size={24} />
                </div>
                <h3 className="kb-title">{article.title}</h3>
                <div className="kb-meta">
                  <span className="badge badge-gray badge-sm">{article.category}</span>
                  <span className="kb-views">{article.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'feedback' && (
        <div className="portal-content">
          <div className="feedback-section card">
            <h3>How was your experience?</h3>
            <p className="text-secondary">Your feedback helps us improve our service</p>
            <div className="rating-stars">
              {[1,2,3,4,5].map(star => (
                <button key={star} className="star-btn">
                  <Star size={32} />
                </button>
              ))}
            </div>
            <textarea className="form-textarea" placeholder="Tell us more about your experience..."></textarea>
            <button className="btn btn-primary">Submit Feedback</button>
          </div>
        </div>
      )}

      {showNewTicket && (
        <div className="modal-overlay" onClick={() => setShowNewTicket(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Ticket</h3>
              <button onClick={() => setShowNewTicket(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label form-label-required">Subject</label>
                <input type="text" className="form-input" placeholder="Brief description of your issue" />
              </div>
              <div className="form-group">
                <label className="form-label form-label-required">Description</label>
                <textarea className="form-textarea" placeholder="Detailed description of your issue"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNewTicket(false)} className="btn btn-secondary">Cancel</button>
              <button className="btn btn-primary">Create Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerPortal
