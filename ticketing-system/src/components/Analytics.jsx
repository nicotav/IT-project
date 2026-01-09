import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, Users, CheckCircle, AlertTriangle, Calendar, Download } from 'lucide-react'
import api from '../services/api'
import './Analytics.css'

function Analytics() {
  const [dateRange, setDateRange] = useState('7d')
  const [loading, setLoading] = useState(false)
  
  // Mock analytics data
  const dashboardStats = {
    totalTickets: 284,
    resolvedTickets: 198,
    avgResolutionTime: '4.2h',
    customerSatisfaction: 94,
    ticketsTrend: '+12%',
    resolutionTrend: '+8%',
    timeTrend: '-15%',
    satisfactionTrend: '+3%'
  }

  const categoryData = [
    { category: 'Hardware Issues', count: 45, percentage: 35 },
    { category: 'Software Problems', count: 38, percentage: 30 },
    { category: 'Network Issues', count: 25, percentage: 20 },
    { category: 'Access Requests', count: 19, percentage: 15 }
  ]

  const technicianPerformance = [
    { name: 'John Doe', resolved: 52, avgTime: '3.5h', satisfaction: 96 },
    { name: 'Jane Smith', resolved: 48, avgTime: '4.1h', satisfaction: 94 },
    { name: 'Mike Johnson', resolved: 45, avgTime: '4.8h', satisfaction: 92 },
    { name: 'Sarah Williams', resolved: 38, avgTime: '3.9h', satisfaction: 95 }
  ]

  const slaCompliance = [
    { level: 'Critical', target: 95, actual: 98, tickets: 15 },
    { level: 'High', target: 90, actual: 92, tickets: 42 },
    { level: 'Medium', target: 85, actual: 88, tickets: 68 },
    { level: 'Low', target: 80, actual: 91, tickets: 45 }
  ]

  return (
    <div className="analytics fade-in">
      <div className="page-header card">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <BarChart3 size={28} />
            </div>
            <div>
              <h2 className="page-title">Analytics & Reports</h2>
              <p className="page-subtitle">Performance insights and metrics</p>
            </div>
          </div>
          <div className="header-actions">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="form-select">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="btn btn-secondary">
              <Download size={18} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card card">
          <div className="metric-header">
            <div className="metric-icon primary">
              <BarChart3 size={24} />
            </div>
            <span className={`metric-trend ${dashboardStats.ticketsTrend.startsWith('+') ? 'positive' : 'negative'}`}>
              {dashboardStats.ticketsTrend}
            </span>
          </div>
          <div className="metric-value">{dashboardStats.totalTickets}</div>
          <div className="metric-label">Total Tickets</div>
        </div>

        <div className="metric-card card">
          <div className="metric-header">
            <div className="metric-icon success">
              <CheckCircle size={24} />
            </div>
            <span className={`metric-trend positive`}>
              {dashboardStats.resolutionTrend}
            </span>
          </div>
          <div className="metric-value">{dashboardStats.resolvedTickets}</div>
          <div className="metric-label">Resolved Tickets</div>
        </div>

        <div className="metric-card card">
          <div className="metric-header">
            <div className="metric-icon warning">
              <Clock size={24} />
            </div>
            <span className={`metric-trend positive`}>
              {dashboardStats.timeTrend}
            </span>
          </div>
          <div className="metric-value">{dashboardStats.avgResolutionTime}</div>
          <div className="metric-label">Avg Resolution Time</div>
        </div>

        <div className="metric-card card">
          <div className="metric-header">
            <div className="metric-icon info">
              <TrendingUp size={24} />
            </div>
            <span className={`metric-trend positive`}>
              {dashboardStats.satisfactionTrend}
            </span>
          </div>
          <div className="metric-value">{dashboardStats.customerSatisfaction}%</div>
          <div className="metric-label">Customer Satisfaction</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card card">
          <div className="card-header">
            <h3 className="card-title">Tickets by Category</h3>
          </div>
          <div className="chart-content">
            {categoryData.map(item => (
              <div key={item.category} className="category-bar">
                <div className="category-info">
                  <span className="category-name">{item.category}</span>
                  <span className="category-count">{item.count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${item.percentage}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card card">
          <div className="card-header">
            <h3 className="card-title">SLA Compliance</h3>
          </div>
          <div className="sla-grid">
            {slaCompliance.map(sla => (
              <div key={sla.level} className="sla-item">
                <div className="sla-header">
                  <span className={`badge badge-${sla.level === 'Critical' ? 'danger' : sla.level === 'High' ? 'warning' : sla.level === 'Medium' ? 'primary' : 'success'}`}>
                    {sla.level}
                  </span>
                  <span className="sla-tickets">{sla.tickets} tickets</span>
                </div>
                <div className="sla-metrics">
                  <div className="sla-metric">
                    <span className="sla-label">Target</span>
                    <span className="sla-value">{sla.target}%</span>
                  </div>
                  <div className="sla-metric">
                    <span className="sla-label">Actual</span>
                    <span className={`sla-value ${sla.actual >= sla.target ? 'success' : 'warning'}`}>
                      {sla.actual}%
                    </span>
                  </div>
                </div>
                <div className="sla-progress">
                  <div className="progress-fill" style={{width: `${(sla.actual / sla.target) * 100}%`, background: sla.actual >= sla.target ? 'var(--success-500)' : 'var(--warning-500)'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="performance-card card">
        <div className="card-header">
          <h3 className="card-title">
            <Users size={20} />
            Technician Performance
          </h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Tickets Resolved</th>
                <th>Avg Resolution Time</th>
                <th>Customer Satisfaction</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {technicianPerformance.map((tech, index) => (
                <tr key={tech.name}>
                  <td>
                    <div className="tech-info">
                      <div className="tech-avatar">{tech.name.split(' ').map(n => n[0]).join('')}</div>
                      <span className="font-medium">{tech.name}</span>
                    </div>
                  </td>
                  <td><strong>{tech.resolved}</strong></td>
                  <td>{tech.avgTime}</td>
                  <td>
                    <div className="satisfaction-score">
                      <span className="score-value">{tech.satisfaction}%</span>
                      <div className="score-bar">
                        <div className="score-fill" style={{width: `${tech.satisfaction}%`}}></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${index === 0 ? 'badge-success' : index === 1 ? 'badge-primary' : 'badge-gray'}`}>
                      {index === 0 ? '🏆 Top Performer' : index === 1 ? '⭐ Excellent' : '✓ Good'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
