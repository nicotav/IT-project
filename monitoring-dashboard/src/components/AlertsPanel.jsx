import { useState } from 'react'
import './AlertsPanel.css'

function AlertsPanel({ alerts }) {
  const [filter, setFilter] = useState('all')

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '●'
    }
  }

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : filter === 'active' 
      ? alerts.filter(a => !a.acknowledged)
      : alerts.filter(a => a.severity === filter)

  return (
    <div className="panel alerts-panel">
      <div className="panel-header">
        <h2>Alerts</h2>
        <span className="panel-count">
          {alerts.filter(a => !a.acknowledged).length} active
        </span>
      </div>

      <div className="alert-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button 
          className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          Critical
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
            style={{ borderLeftColor: getSeverityColor(alert.severity) }}
          >
            <div className="alert-header">
              <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
              <span className="alert-service">{alert.service}</span>
              <span className="alert-time">{formatTime(alert.time)}</span>
            </div>
            <p className="alert-message">{alert.message}</p>
            {!alert.acknowledged && (
              <button className="acknowledge-btn">Acknowledge</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlertsPanel
