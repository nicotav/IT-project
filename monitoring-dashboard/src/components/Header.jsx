import './Header.css'

function Header({ lastRefresh, refreshInterval, setRefreshInterval }) {
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  return (
    <header className="monitoring-header">
      <div className="header-container">
        <div className="header-left">
          <h1>
            <span className="header-icon">📊</span>
            Monitoring Dashboard
          </h1>
          <a href="http://localhost:3000" className="back-link">← Access Center</a>
        </div>

        <div className="header-right">
          <div className="refresh-info">
            <span className="live-indicator">●</span>
            <span>Last updated: {formatTime(lastRefresh)}</span>
          </div>
          
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="refresh-select"
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
        </div>
      </div>
    </header>
  )
}

export default Header
