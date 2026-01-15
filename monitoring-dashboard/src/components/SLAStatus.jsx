import './SLAStatus.css'

function SLAStatus({ data }) {
  if (!data) return null

  const slaPercentage = (data.current / data.target) * 100
  const isOnTrack = data.current >= data.target

  return (
    <div className="panel sla-panel">
      <div className="panel-header">
        <h2>SLA Status</h2>
      </div>

      <div className="sla-content">
        <div className="sla-main">
          <div className="sla-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#334155"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isOnTrack ? '#10b981' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={`${slaPercentage * 2.827} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="sla-value">
              <span className="value">{data.current}%</span>
              <span className="label">Current</span>
            </div>
          </div>

          <div className="sla-target">
            Target: <strong>{data.target}%</strong>
          </div>
        </div>

        <div className="sla-metrics">
          <div className="sla-metric">
            <div className="metric-icon">🎫</div>
            <div>
              <div className="metric-value">{data.incidents}</div>
              <div className="metric-label">Incidents</div>
            </div>
          </div>

          <div className="sla-metric">
            <div className="metric-icon">⚠️</div>
            <div>
              <div className="metric-value">{data.breaches}</div>
              <div className="metric-label">SLA Breaches</div>
            </div>
          </div>

          <div className="sla-metric">
            <div className="metric-icon">⏱️</div>
            <div>
              <div className="metric-value">{data.mttr}m</div>
              <div className="metric-label">MTTR</div>
            </div>
          </div>
        </div>

        <div className={`sla-status ${isOnTrack ? 'on-track' : 'at-risk'}`}>
          {isOnTrack ? '✓ On Track' : '⚠ At Risk'}
        </div>
      </div>
    </div>
  )
}

export default SLAStatus
