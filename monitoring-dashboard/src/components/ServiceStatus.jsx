import './ServiceStatus.css'

function ServiceStatus({ services }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'up': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'down': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'up': return '✓'
      case 'degraded': return '⚠'
      case 'down': return '✕'
      default: return '?'
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Service Status</h2>
        <span className="panel-count">{services.length} services</span>
      </div>

      <div className="services-grid">
        {services.map(service => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <div 
                className="service-status-badge"
                style={{ backgroundColor: getStatusColor(service.status) + '20', color: getStatusColor(service.status) }}
              >
                <span className="status-icon">{getStatusIcon(service.status)}</span>
                <span className="status-text">{service.status}</span>
              </div>
            </div>

            <h3 className="service-name">{service.name}</h3>

            <div className="service-metrics">
              <div className="service-metric">
                <span className="metric-label">Uptime</span>
                <span className="metric-value">{service.uptime}%</span>
              </div>
              <div className="service-metric">
                <span className="metric-label">Response</span>
                <span className="metric-value">{service.responseTime}ms</span>
              </div>
            </div>

            <div className="service-footer">
              <span className="last-check">
                Last check: {new Date(service.lastCheck).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceStatus
