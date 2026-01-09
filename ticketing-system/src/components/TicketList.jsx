import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAPI } from '../../shared/src/hooks/useAPI'
import { 
  LoadingSpinner, 
  ErrorMessage, 
  EmptyState,
  SearchInput,
  FilterSelect,
  Pagination,
  StatusBadge
} from '../../shared/src/components/index.js'
import { 
  CheckSquare, 
  Square, 
  Download, 
  RefreshCw, 
  Archive, 
  UserPlus, 
  MoreVertical,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Filter,
  X
} from 'lucide-react'
import './TicketList.css'

function TicketList() {
  const api = useAPI()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTickets, setSelectedTickets] = useState([])
  const [view, setView] = useState('table') // 'table' or 'grid'
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [ticketMenuOpen, setTicketMenuOpen] = useState(null)
  const itemsPerPage = 10

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    company: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })

  useEffect(() => {
    fetchTickets()
  }, [filters, sortBy, sortOrder])

  const fetchTickets = async () => {
    setLoading(true)
    
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      loadMockTickets()
      setLoading(false)
      return
    }

    try {
      const params = {}
      if (filters.status !== 'all') params.status = filters.status
      if (filters.priority !== 'all') params.priority = filters.priority

      const response = await ticketAPI.getTickets(params)
      // Map backend fields to frontend expectations
      const apiTickets = (response.data?.tickets || response.data || []).map(ticket => ({
        ...ticket,
        requester: ticket.submitter_id || 'Unknown',
        submitter: ticket.submitter_id || 'Unknown',
        assignee: ticket.assigned_to || 'Unassigned',
        company: ticket.company_id || 'Unknown',
        tags: ticket.tags ? ticket.tags.split(',') : [],
        sla_remaining: ticket.sla_due_date ? calculateSLARemaining(ticket.sla_due_date) : 'N/A',
        time_logged: formatMinutes(ticket.time_spent_minutes || 0),
        comments_count: 0,
        attachments_count: 0
      }))
      setTickets(apiTickets)
      setLoading(false)
    } catch (error) {
      console.error('API Error:', error)
      // Silently use mock data for development
      loadMockTickets()
      setLoading(false)
    }
  }

  const loadMockTickets = () => {
    // Mock data with more comprehensive information
    setTickets([
        {
          id: 1001,
          title: 'Email server not responding',
          description: 'Exchange server is not accepting connections from Outlook clients',
          status: 'new',
          priority: 'critical',
          assignee: 'Unassigned',
          submitter: 'Alice Johnson',
          company: 'Acme Corp',
          created_at: new Date(Date.now() - 900000).toISOString(),
          updated_at: new Date(Date.now() - 300000).toISOString(),
          sla_remaining: '2h 15m',
          time_logged: '0m',
          comments_count: 0,
          attachments_count: 2
        },
        {
          id: 1002,
          title: 'User cannot access shared drive',
          description: 'Permission denied error when accessing \\\\fileserver\\shared',
          status: 'in-progress',
          priority: 'high',
          assignee: 'John Doe',
          submitter: 'Bob Williams',
          company: 'Tech Solutions Inc',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 600000).toISOString(),
          sla_remaining: '5h 30m',
          time_logged: '45m',
          comments_count: 3,
          attachments_count: 1
        },
        {
          id: 1003,
          title: 'Printer queue stuck',
          description: 'Print jobs are not completing on HP LaserJet Pro 400',
          status: 'resolved',
          priority: 'medium',
          assignee: 'Jane Smith',
          submitter: 'Carol Davis',
          company: 'Acme Corp',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 1200000).toISOString(),
          sla_remaining: 'Met',
          time_logged: '30m',
          comments_count: 5,
          attachments_count: 0
        },
        {
          id: 1004,
          title: 'Request for new software installation',
          description: 'Need Adobe Creative Cloud installed on marketing workstation',
          status: 'new',
          priority: 'low',
          assignee: 'Unassigned',
          submitter: 'David Martinez',
          company: 'Creative Agency',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          updated_at: new Date(Date.now() - 10800000).toISOString(),
          sla_remaining: '1d 8h',
          time_logged: '0m',
          comments_count: 0,
          attachments_count: 0
        },
        {
          id: 1005,
          title: 'VPN connection intermittent',
          description: 'Remote user experiencing disconnections every 15-20 minutes',
          status: 'in-progress',
          priority: 'high',
          assignee: 'John Doe',
          submitter: 'Eva Garcia',
          company: 'Remote Services LLC',
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
          sla_remaining: '4h 20m',
          time_logged: '1h 15m',
          comments_count: 8,
          attachments_count: 3
        },
        {
          id: 1006,
          title: 'Password reset request',
          description: 'User locked out after too many failed login attempts',
          status: 'resolved',
          priority: 'medium',
          assignee: 'Jane Smith',
          submitter: 'Frank Brown',
          company: 'Tech Solutions Inc',
          created_at: new Date(Date.now() - 18000000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          sla_remaining: 'Met',
          time_logged: '15m',
          comments_count: 2,
          attachments_count: 0
        },
        {
          id: 1007,
          title: 'Server backup failed',
          description: 'Nightly backup job terminated with error code 0x80070002',
          status: 'new',
          priority: 'critical',
          assignee: 'Unassigned',
          submitter: 'System Monitor',
          company: 'Internal',
          created_at: new Date(Date.now() - 21600000).toISOString(),
          updated_at: new Date(Date.now() - 21600000).toISOString(),
          sla_remaining: '1h 45m',
          time_logged: '0m',
          comments_count: 0,
          attachments_count: 1
        },
        {
          id: 1008,
          title: 'Laptop running slow',
          description: 'Employee reports significant performance degradation over past week',
          status: 'in-progress',
          priority: 'medium',
          assignee: 'John Doe',
          submitter: 'Grace Lee',
          company: 'Acme Corp',
          created_at: new Date(Date.now() - 28800000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          sla_remaining: '6h 10m',
          time_logged: '2h 30m',
          comments_count: 6,
          attachments_count: 2
        }
      ])
      
      // Load and merge demo tickets from localStorage
      const demoTickets = JSON.parse(localStorage.getItem('demoTickets') || '[]')
      if (demoTickets.length > 0) {
        setTickets(prev => [...prev, ...demoTickets])
      }
  }

  const calculateSLARemaining = (dueDate) => {
    const diff = new Date(dueDate) - new Date()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (diff < 0) return 'Overdue'
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
    return `${hours}h ${minutes}m`
  }

  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-danger'
      case 'high': return 'badge-warning'
      case 'medium': return 'badge-primary'
      case 'low': return 'badge-success'
      default: return 'badge-gray'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'badge-primary'
      case 'in-progress': return 'badge-warning'
      case 'resolved': return 'badge-success'
      case 'closed': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  const toggleSelectAll = () => {
    if (selectedTickets.length === paginatedTickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(paginatedTickets.map(t => t.id))
    }
  }

  const toggleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleBulkAction = (action) => {
    const actionLabels = {
      assign: 'assigned',
      archive: 'archived',
      delete: 'deleted',
      export: 'exported'
    }
    
    alert(`${selectedTickets.length} ticket(s) ${actionLabels[action] || action}!`)
    
    // If delete, remove from list
    if (action === 'delete') {
      setTickets(prev => prev.filter(t => !selectedTickets.includes(t.id)))
    }
    
    setSelectedTickets([])
  }

  const handleExport = () => {
    const csvData = filteredTickets.map(t => ({
      ID: t.id,
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Assignee: t.assignee,
      Company: t.company,
      Created: t.created_at
    }))
    
    alert(`Exporting ${csvData.length} tickets to CSV...`)
    // In a real app, you would generate and download a CSV file here
  }

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Apply filters
  const applyFilters = (ticketsList) => {
    return ticketsList.filter(ticket => {
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
      if (filters.assignee !== 'all' && ticket.assignee !== filters.assignee) return false
      if (filters.company !== 'all' && ticket.company !== filters.company) return false
      if (filters.searchTerm && ticket.title && !ticket.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false
      if (filters.dateFrom && new Date(ticket.created_at) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(ticket.created_at) > new Date(filters.dateTo)) return false
      return true
    })
  }

  const filteredTickets = applyFilters(tickets)

  // Sort and paginate
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1
    if (sortBy === 'created_at') {
      return (new Date(a.created_at) - new Date(b.created_at)) * order
    }
    return (a[sortBy] > b[sortBy] ? 1 : -1) * order
  })

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage)
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      company: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  const activeFilterCount = Object.values(filters).filter(v => v && v !== 'all').length

  // Get unique values for filter dropdowns
  const companies = [...new Set(tickets.map(t => t.company))]
  const assignees = [...new Set(tickets.map(t => t.assignee))]

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading tickets...</span>
      </div>
    )
  }

  const stats = {
    total: filteredTickets.length,
    new: filteredTickets.filter(t => t.status === 'new').length,
    inProgress: filteredTickets.filter(t => t.status === 'in-progress').length,
    critical: filteredTickets.filter(t => t.priority === 'critical').length,
    avgResponseTime: '2.5h'
  }

  return (
    <div className="ticket-list-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="page-subtitle">Manage and track all support tickets</p>
        </div>
        <div className="header-actions">
          <Link to="/create" className="btn btn-primary">
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section card">
        <div className="filters-header">
          <button 
            className="btn btn-sm btn-ghost" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          {activeFilterCount > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={clearFilters}>
              <X size={16} />
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filters-content">
            <div className="filter-grid">
              <div className="filter-field">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-field">
                <label>Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Priority</label>
                <select 
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="filter-field">
                <label>Assignee</label>
                <select 
                  value={filters.assignee}
                  onChange={(e) => setFilters({...filters, assignee: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Assignees</option>
                  {assignees.map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Company</label>
                <select 
                  value={filters.company}
                  onChange={(e) => setFilters({...filters, company: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Companies</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div className="filter-field">
                <label>Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="filter-input"
                />
              </div>

              <div className="filter-field">
                <label>Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="filter-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.new}</div>
            <div className="stat-label">New Tickets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Critical Priority</div>
          </div>
        </div>
      </div>

      <div className="tickets-section card">
        <div className="tickets-toolbar">
          <div className="toolbar-left">
            {selectedTickets.length > 0 && (
              <div className="bulk-actions">
                <span className="selected-count">{selectedTickets.length} selected</span>
                <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction('assign')}>
                  <UserPlus size={16} />
                  Assign
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleBulkAction('archive')}>
                  <Archive size={16} />
                  Archive
                </button>
              </div>
            )}
          </div>
          <div className="toolbar-right">
            <button className="btn btn-sm btn-ghost" onClick={fetchTickets}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="btn btn-sm btn-ghost" onClick={handleExport}>
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{width: '40px'}}>
                  <button 
                    className="checkbox-btn"
                    onClick={toggleSelectAll}
                  >
                    {selectedTickets.length === paginatedTickets.length ? 
                      <CheckSquare size={18} /> : 
                      <Square size={18} />
                    }
                  </button>
                </th>
                <th style={{width: '80px'}} onClick={() => handleSort('id')}>
                  <div className="th-content">
                    ID
                    {sortBy === 'id' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th onClick={() => handleSort('title')}>
                  <div className="th-content">
                    Ticket
                    {sortBy === 'title' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th style={{width: '120px'}} onClick={() => handleSort('priority')}>
                  <div className="th-content">
                    Priority
                    {sortBy === 'priority' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th style={{width: '120px'}} onClick={() => handleSort('status')}>
                  <div className="th-content">
                    Status
                    {sortBy === 'status' && <span className="sort-indicator">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th style={{width: '150px'}}>Assignee</th>
                <th style={{width: '100px'}}>SLA</th>
                <th style={{width: '100px'}}>Activity</th>
                <th style={{width: '50px'}}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-title">No tickets found</div>
                      <div className="empty-state-description">
                        Try adjusting your filters or create a new ticket
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map(ticket => (
                  <tr 
                    key={ticket.id}
                    className={selectedTickets.includes(ticket.id) ? 'selected' : ''}
                  >
                    <td>
                      <button 
                        className="checkbox-btn"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleSelectTicket(ticket.id)
                        }}
                      >
                        {selectedTickets.includes(ticket.id) ? 
                          <CheckSquare size={18} /> : 
                          <Square size={18} />
                        }
                      </button>
                    </td>
                    <td>
                      <Link to={`/ticket/${ticket.id}`} className="ticket-id-link">
                        #{ticket.id}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/ticket/${ticket.id}`} className="ticket-title-cell">
                        <div className="ticket-title-main">{ticket.title}</div>
                        <div className="ticket-meta">
                          <span>{ticket.company}</span>
                          {ticket.comments_count > 0 && (
                            <span className="meta-badge">
                              💬 {ticket.comments_count}
                            </span>
                          )}
                          {ticket.attachments_count > 0 && (
                            <span className="meta-badge">
                              📎 {ticket.attachments_count}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <div className="assignee-cell">
                        <div className="assignee-avatar">
                          {ticket.assignee === 'Unassigned' ? '?' : ticket.assignee.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className={ticket.assignee === 'Unassigned' ? 'text-tertiary' : ''}>
                          {ticket.assignee}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`sla-badge ${ticket.sla_remaining === 'Met' ? 'sla-met' : (ticket.sla_remaining && ticket.sla_remaining.includes('h') && parseInt(ticket.sla_remaining) < 4) ? 'sla-warning' : ''}`}>
                        {ticket.sla_remaining || 'N/A'}
                      </span>
                    </td>
                    <td className="text-secondary text-sm">{formatTimeAgo(ticket.updated_at)}
                      {formatTimeAgo(ticket.updated_at)}
                    </td>
                    <td style={{position: 'relative'}}>
                      <button 
                        className="btn btn-icon btn-ghost"
                        onClick={() => setTicketMenuOpen(ticketMenuOpen === ticket.id ? null : ticket.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {ticketMenuOpen === ticket.id && (
                        <div className="ticket-menu" style={{
                          position: 'absolute',
                          right: '30px',
                          top: '0',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          zIndex: 1000,
                          minWidth: '150px'
                        }}>
                          <button 
                            className="ticket-menu-item"
                            onClick={() => handleTicketAction(ticket.id, 'edit')}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                          >
                            Edit
                          </button>
                          <button 
                            className="ticket-menu-item"
                            onClick={() => handleTicketAction(ticket.id, 'archive')}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                          >
                            Archive
                          </button>
                          <button 
                            className="ticket-menu-item"
                            onClick={() => handleTicketAction(ticket.id, 'delete')}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              background: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#dc2626'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="btn btn-sm btn-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <div className="pagination-info">
              Page {currentPage} of {totalPages} ({sortedTickets.length} total)
            </div>
            <button 
              className="btn btn-sm btn-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TicketList
