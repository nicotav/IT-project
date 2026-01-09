import { Link, useLocation } from 'react-router-dom'
import { Ticket, LayoutGrid, Calendar, Users, Building2, BarChart3, Globe, Home, Package } from 'lucide-react'
import './Sidebar.css'

function Sidebar() {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/tickets', label: 'Tickets', icon: Ticket },
    { path: '/boards', label: 'Boards', icon: LayoutGrid },
    { path: '/appointments', label: 'Schedule', icon: Calendar },
    { path: '/teams', label: 'Teams', icon: Users },
    { path: '/clients', label: 'Clients', icon: Building2 },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/portal', label: 'Portal', icon: Globe }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>MSP Ticketing</h1>
            <span className="logo-subtitle">Professional Edition</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
                          (item.path === '/tickets' && location.pathname === '/')
          
          return (
            <Link
              key={item.path}
              to={item.path === '/tickets' ? '/' : item.path}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">NT</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Nicolas Taveras</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
