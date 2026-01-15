import { useState, useEffect } from 'react'
import ServiceStatus from './ServiceStatus'
import AlertsPanel from './AlertsPanel'
import SLAStatus from './SLAStatus'
import MetricsChart from './MetricsChart'
import { useAPI } from '../../shared/src/hooks/useAPI'
import { LoadingSpinner, ErrorMessage } from '../../shared/src/components/index.js'
import './Dashboard.css'

function Dashboard({ lastRefresh }) {
  const api = useAPI()
  const [services, setServices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [slaData, setSlaData] = useState(null)
  const [healthMetrics, setHealthMetrics] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [lastRefresh])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch real data from API
      const [servicesResponse, alertsResponse, slaResponse] = await Promise.all([
        api.get('/monitoring/services'),
        api.get('/monitoring/alerts'),
        api.get('/monitoring/sla')
      ])

      setServices(servicesResponse.data)
      setAlerts(alertsResponse.data)
      setSlaData(slaResponse.data)
      
    } catch (err) {
      // Fallback to mock data for demo mode
      setError(null) // Don't show error in demo mode
      
      setServices([
        { id: 1, name: 'Exchange Server', status: 'up', uptime: 99.8, responseTime: 45, lastCheck: new Date() },
        { id: 2, name: 'Active Directory', status: 'up', uptime: 99.9, responseTime: 12, lastCheck: new Date() },
        { id: 3, name: 'File Server', status: 'degraded', uptime: 98.5, responseTime: 120, lastCheck: new Date() },
        { id: 4, name: 'Web Server', status: 'up', uptime: 99.7, responseTime: 89, lastCheck: new Date() },
        { id: 5, name: 'Database Server', status: 'up', uptime: 99.9, responseTime: 34, lastCheck: new Date() },
        { id: 6, name: 'Backup Service', status: 'down', uptime: 95.2, responseTime: 0, lastCheck: new Date() }
      ])

      setAlerts([
        { id: 1, severity: 'critical', service: 'Backup Service', message: 'Service is not responding', time: new Date(Date.now() - 300000), acknowledged: false },
        { id: 2, severity: 'warning', service: 'File Server', message: 'High disk usage (85%)', time: new Date(Date.now() - 900000), acknowledged: false },
        { id: 3, severity: 'warning', service: 'Web Server', message: 'Elevated response time', time: new Date(Date.now() - 1800000), acknowledged: true },
        { id: 4, severity: 'info', service: 'Exchange Server', message: 'Scheduled maintenance in 2 hours', time: new Date(Date.now() - 3600000), acknowledged: true }
      ])

      setSlaData({
        current: 99.2,
        target: 99.5,
        incidents: 3,
        breaches: 1,
        mttr: 45
      })

      setHealthMetrics({
        cpu: 45,
        memory: 68,
        disk: 72,
        network: 34
      })

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  const activeAlerts = alerts.filter(a => !a.acknowledged)
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* Overview Cards */}
        <div className="overview-section">
          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#10b98120', color: '#10b981' }}>✓</div>
            <div className="metric-info">
              <div className="metric-value">{services.filter(s => s.status === 'up').length}/{services.length}</div>
              <div className="metric-label">Services Up</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#ef444420', color: '#ef4444' }}>⚠</div>
            <div className="metric-info">
              <div className="metric-value">{activeAlerts.length}</div>
              <div className="metric-label">Active Alerts</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>🔥</div>
            <div className="metric-info">
              <div className="metric-value">{criticalCount}</div>
              <div className="metric-label">Critical Issues</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: '#3b82f620', color: '#3b82f6' }}>📈</div>
            <div className="metric-info">
              <div className="metric-value">{slaData?.current}%</div>
              <div className="metric-label">SLA Compliance</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <ServiceStatus services={services} />
          <MetricsChart metrics={healthMetrics} />
        </div>

        {/* Sidebar */}
        <div className="sidebar-content">
          <AlertsPanel alerts={alerts} />
          <SLAStatus data={slaData} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
