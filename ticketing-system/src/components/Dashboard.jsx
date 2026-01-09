import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, 
  Ticket, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart3,
  User,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAPI, mockDataManager } from '../../../shared/src/index.js'
import { ticketAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [weekOffset, setWeekOffset] = useState(0)
  
  // Use shared hook to fetch tickets with automatic fallback to mock data
  const { data: tickets, loading } = useAPI(
    ticketAPI.getTickets,
    [weekOffset],
    {
      fallbackData: mockDataManager.generateMockTickets(15),
      requireAuth: false
    }
  )

  // Calculate stats from tickets data
  const stats = {
    totalTickets: tickets?.length || 0,
    openTickets: tickets?.filter(t => t.status === 'open').length || 0,
    closedTickets: tickets?.filter(t => t.status === 'closed').length || 0,
    pendingTickets: tickets?.filter(t => t.status === 'pending').length || 0
  }

  const recentTickets = tickets?.slice(0, 5) || []

  // Mock weekly data for chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    tickets: Math.floor(Math.random() * 15) + 5,
    resolved: Math.floor(Math.random() * 10) + 2
  }))

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6'
      case 'in_progress': return '#f59e0b'
      case 'resolved': return '#10b981'
      case 'closed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Ticketing Dashboard</h1>
          <p>Overview of all ticket activities and metrics</p>
        </div>
        <div className="header-actions">
          <Link to="/create" className="btn-primary">
            <Ticket size={16} />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <Ticket size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.totalTickets}</h3>
            <p>Total Tickets</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
            <Clock size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.openTickets}</h3>
            <p>Open Tickets</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <CheckCircle size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.closedTickets}</h3>
            <p>Resolved Today</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ef4444' }}>
            <AlertTriangle size={24} color="white" />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingTickets}</h3>
            <p>Pending Review</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Tickets */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Tickets</h3>
            <Link to="/tickets" className="btn-link">View All</Link>
          </div>
          <div className="recent-tickets">
            {recentTickets.map(ticket => (
              <Link key={ticket.id} to={`/ticket/${ticket.id}`} className="ticket-item">
                <div className="ticket-info">
                  <div className="ticket-title">{ticket.title}</div>
                  <div className="ticket-meta">
                    <span className="ticket-id">#{ticket.id}</span>
                    <span 
                      className="ticket-status"
                      style={{ color: getStatusColor(ticket.status) }}
                    >
                      {ticket.status}
                    </span>
                    <span 
                      className="ticket-priority"
                      style={{ color: getPriorityColor(ticket.priority) }}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="ticket-assignee">
                  <User size={16} />
                  {ticket.assignee || 'Unassigned'}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>This Week's Activity</h3>
            <div className="week-navigation">
              <button onClick={() => setWeekOffset(weekOffset + 1)}>
                <ChevronLeft size={16} />
              </button>
              <span>
                {weekOffset === 0 ? 'Current Week' : `${weekOffset} week${weekOffset > 1 ? 's' : ''} ago`}
              </span>
              <button 
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="weekly-chart">
            {weeklyData.map(day => (
              <div key={day.day} className="chart-bar">
                <div className="bar-group">
                  <div 
                    className="bar created"
                    style={{ height: `${(day.tickets / 20) * 100}%` }}
                    title={`${day.tickets} created`}
                  />
                  <div 
                    className="bar resolved"
                    style={{ height: `${(day.resolved / 20) * 100}%` }}
                    title={`${day.resolved} resolved`}
                  />
                </div>
                <div className="bar-label">{day.day}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color created"></span>
              Created
            </div>
            <div className="legend-item">
              <span className="legend-color resolved"></span>
              Resolved
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard