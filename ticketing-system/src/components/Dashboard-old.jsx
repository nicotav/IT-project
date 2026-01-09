import { useState, useEffect } from 'react'
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
import { ticketAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    pendingTickets: 0
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, 1 = last week, etc.

  useEffect(() => {
    fetchDashboardData()
  }, [weekOffset])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    if (!token) {
      // Use mock data if no authentication
      generateMockData()
      setLoading(false)
      return
    }

    try {
      const response = await ticketAPI.getTickets()
      const tickets = response.data || []
      
      // Calculate stats
      const open = tickets.filter(t => ['new', 'in_progress', 'pending'].includes(t.status)).length
      const closed = tickets.filter(t => t.status === 'closed').length
      const pending = tickets.filter(t => t.status === 'pending').length
      
      setStats({
        totalTickets: tickets.length,
        openTickets: open,
        closedTickets: closed,
        pendingTickets: pending
      })
      
      // Get last 10 tickets
      setRecentTickets(tickets.slice(0, 10))
      
      // Calculate weekly data
      const today = new Date(2026, 0, 19) // January 19, 2026
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7)) // Start from Sunday
      
      const weeklyStats = Array(7).fill(0).map((_, index) => {
        const currentDay = new Date(startOfWeek)
        currentDay.setDate(startOfWeek.getDate() + index)
        
        const dayTickets = tickets.filter(t => {
          const ticketDate = new Date(t.created_at)
          return ticketDate.toDateString() === currentDay.toDateString()
        })
        
        const openCount = dayTickets.filter(t => ['new', 'in_progress', 'pending'].includes(t.status)).length
        const closedCount = dayTickets.filter(t => t.status === 'closed').length
        
        return { 
          day: currentDay.getDate(),
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
          date: currentDay.toISOString().split('T')[0],
          open: openCount,
          closed: closedCount
        }
      })
      
      setWeeklyData(weeklyStats)
    } catch (error) {
      // Silently use mock data for development
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    // Mock stats
    setStats({
      totalTickets: 156,
      openTickets: 45,
      closedTickets: 98,
      pendingTickets: 13
    })

    // Mock recent tickets
    setRecentTickets([
      { id: 1234, title: 'Email server not responding', status: 'new', priority: 'high', created_at: '2026-01-19T10:30:00', assigned_to: 'Tech Team' },
      { id: 1233, title: 'Printer not working in Finance', status: 'in_progress', priority: 'medium', created_at: '2026-01-19T09:15:00', assigned_to: 'Nicolas Taveras' },
      { id: 1232, title: 'Password reset request', status: 'closed', priority: 'low', created_at: '2026-01-18T16:45:00', assigned_to: 'Support Team' },
      { id: 1231, title: 'New software installation needed', status: 'pending', priority: 'medium', created_at: '2026-01-18T14:20:00', assigned_to: 'IT Admin' },
      { id: 1230, title: 'Network connectivity issues', status: 'in_progress', priority: 'high', created_at: '2026-01-18T11:30:00', assigned_to: 'Network Team' },
      { id: 1229, title: 'VPN access request', status: 'closed', priority: 'low', created_at: '2026-01-17T15:10:00', assigned_to: 'Security Team' },
      { id: 1228, title: 'Database backup failed', status: 'new', priority: 'critical', created_at: '2026-01-17T13:25:00', assigned_to: 'Database Admin' },
      { id: 1227, title: 'Outlook configuration help', status: 'closed', priority: 'low', created_at: '2026-01-17T10:40:00', assigned_to: 'Help Desk' },
      { id: 1226, title: 'Server maintenance schedule', status: 'pending', priority: 'medium', created_at: '2026-01-16T14:55:00', assigned_to: 'Infrastructure' },
      { id: 1225, title: 'Software license renewal', status: 'in_progress', priority: 'high', created_at: '2026-01-16T09:20:00', assigned_to: 'Procurement' }
    ])

    // Mock weekly data (7 days for current week)
    const today = new Date(2026, 0, 19) // January 19, 2026
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7)) // Start from Sunday
    
    const weeklyStats = Array(7).fill(0).map((_, index) => {
      const currentDay = new Date(startOfWeek)
      currentDay.setDate(startOfWeek.getDate() + index)
      
      return { 
        day: currentDay.getDate(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
        date: currentDay.toISOString().split('T')[0],
        open: Math.floor(Math.random() * 8) + 2, 
        closed: Math.floor(Math.random() * 10) + 3 
      }
    })
    setWeeklyData(weeklyStats)
  }

  const getStatusColor = (status) => {
    const colors = {
      new: '#3b82f6',
      in_progress: '#f59e0b',
      pending: '#8b5cf6',
      closed: '#10b981'
    }
    return colors[status] || '#6b7280'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    }
    return colors[priority] || '#6b7280'
  }

  const getStatusLabel = (status) => {
    const labels = {
      new: 'New',
      in_progress: 'In Progress',
      pending: 'Pending',
      closed: 'Closed'
    }
    return labels[status] || status
  }

  const maxValue = Math.max(...weeklyData.map(d => Math.max(d.open, d.closed)), 10)
  
  // Get week range for display
  const getWeekRange = () => {
    const today = new Date(2026, 0, 19)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[date.getMonth()]} ${date.getDate()}`
    }
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}, 2026`
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your ticket system</p>
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <Clock size={18} />
          Last updated: just now
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Ticket size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Tickets</div>
            <div className="stat-value">{stats.totalTickets}</div>
            <div className="stat-trend positive">
              <ArrowUp size={14} />
              <span>12% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card open">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Open Tickets</div>
            <div className="stat-value">{stats.openTickets}</div>
            <div className="stat-trend negative">
              <ArrowDown size={14} />
              <span>5% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card closed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Closed Tickets</div>
            <div className="stat-value">{stats.closedTickets}</div>
            <div className="stat-trend positive">
              <ArrowUp size={14} />
              <span>18% from last month</span>
            </div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{stats.pendingTickets}</div>
            <div className="stat-trend neutral">
              <span>Same as last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="chart-section">
        <div className="section-header">
          <div>
            <h2>Ticket Activity - {getWeekRange()}</h2>
            <p className="section-subtitle">Weekly open and closed tickets</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#3b82f6' }}></div>
                <span>Open</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#10b981' }}></div>
                <span>Closed</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-icon btn-ghost"
                onClick={() => setWeekOffset(prev => Math.min(prev + 1, 4))}
                disabled={weekOffset >= 4}
                style={{ padding: '8px' }}
                title="Previous week"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="btn btn-icon btn-ghost"
                onClick={() => setWeekOffset(prev => Math.max(prev - 1, 0))}
                disabled={weekOffset === 0}
                style={{ padding: '8px' }}
                title="Next week"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-y-axis">
            {[maxValue, Math.floor(maxValue * 0.75), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.25), 0].map(val => (
              <div key={val} className="y-axis-label">{val}</div>
            ))}
          </div>
          <div className="chart-content">
            <div className="chart-grid">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="grid-line"></div>
              ))}
            </div>
            <div className="chart-bars">
              {weeklyData.map(data => (
                <div key={data.date} className="bar-group">
                  <div className="bar-pair">
                    <div 
                      className="bar bar-open" 
                      style={{ height: `${(data.open / maxValue) * 100}%` }}
                      title={`${data.dayName} ${data.day}: ${data.open} open`}
                    ></div>
                    <div 
                      className="bar bar-closed" 
                      style={{ height: `${(data.closed / maxValue) * 100}%` }}
                      title={`${data.dayName} ${data.day}: ${data.closed} closed`}
                    ></div>
                  </div>
                  <div className="bar-label">
                    <div style={{ fontWeight: '500', fontSize: '12px' }}>{data.dayName}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{data.day}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="recent-section">
        <div className="section-header">
          <div>
            <h2>Recent Tickets</h2>
            <p className="section-subtitle">Last 10 tickets opened</p>
          </div>
          <Link to="/tickets" className="view-all-link">
            View all tickets
          </Link>
        </div>

        <div className="recent-tickets-list">
          {recentTickets.map(ticket => (
            <Link key={ticket.id} to={`/ticket/${ticket.id}`} className="ticket-card">
              <div className="ticket-card-header">
                <div className="ticket-id">#{ticket.id}</div>
                <div className="ticket-badges">
                  <span 
                    className="priority-badge" 
                    style={{ background: getPriorityColor(ticket.priority) }}
                  >
                    {ticket.priority}
                  </span>
                  <span 
                    className="status-badge" 
                    style={{ background: getStatusColor(ticket.status) }}
                  >
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>
              </div>
              <div className="ticket-card-body">
                <h3>{ticket.title}</h3>
                <div className="ticket-meta">
                  <div className="meta-item">
                    <User size={14} />
                    <span>{ticket.assigned_to}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
