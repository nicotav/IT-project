import './MetricsChart.css'

function MetricsChart({ metrics }) {
  return (
    <div className="panel metrics-panel">
      <div className="panel-header">
        <h2>System Health Metrics</h2>
      </div>

      <div className="metrics-grid">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="metric-chart">
            <div className="chart-header">
              <span className="chart-label">{key.toUpperCase()}</span>
              <span className="chart-value">{value}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${value}%`,
                  background: value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MetricsChart
