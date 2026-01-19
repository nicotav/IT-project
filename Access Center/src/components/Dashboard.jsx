import { useAuth, useAPI, mockDataManager } from '../../../shared/src/index.js'
import { statsAPI } from '../services/api'
import './Dashboard.css'

const SYSTEMS = [
  {
    id: 'knowledge',
    name: 'Knowledge Base',
    description: 'IT Documentation & Articles',
    url: 'http://localhost:3001',
    icon: '📚',
    color: '#3b82f6'
  },
  {
    id: 'monitoring',
    name: 'Monitoring Dashboard',
    description: 'System Health & Metrics',
    url: 'http://localhost:3002',
    icon: '📊',
    color: '#10b981'
  },
  {
    id: 'ticketing',
    name: 'Ticketing System',
    description: 'Support & Issue Management',
    url: 'http://localhost:3003',
    icon: '🎫',
    color: '#f59e0b'
  }
]

function Dashboard() {
  const { logout, user } = useAuth()
  const { data: stats, loading, error } = useAPI(
    statsAPI.getStats,
    [],
    { 
      fallbackData: mockDataManager.generateMockDashboardStats(),
      requireAuth: false
    }
  )

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>IT Access Center</h1>
        <button onClick={logout} className="logout-btn">Logout</button>
      </header>

      <div className="stats-grid">
        {loading ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{stats.open_tickets || 0}</h3>
                <p>Open Tickets</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{stats.critical_alerts || 0}</h3>
                <p>Critical Alerts</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <h3>{stats.services_up || 0}/{stats.total_services || 0}</h3>
                <p>Services Up</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>{stats.total_articles || 0}</h3>
                <p>KB Articles</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <h3>{stats.avg_response_time || '0'}m</h3>
                <p>Avg Response Time</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.resolved_today || 0}</h3>
                <p>Resolved Today</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="systems-grid">
        {SYSTEMS.map(system => (
          <a 
            key={system.id}
            href={system.url}
            className="system-card"
            style={{ borderTopColor: system.color }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="system-icon" style={{ backgroundColor: system.color + '20', color: system.color }}>
              {system.icon}
            </div>
            <h2>{system.name}</h2>
            <p>{system.description}</p>
            <span className="arrow">→</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
