import { useState } from 'react'
import { Search, Bell, User, Settings, LogOut, HelpCircle } from 'lucide-react'
import './Header.css'

function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const notifications = [
    { id: 1, type: 'ticket', message: 'New ticket #1234 assigned to you', time: '5m ago', unread: true },
    { id: 2, type: 'comment', message: 'John commented on ticket #1230', time: '15m ago', unread: true },
    { id: 3, type: 'status', message: 'Ticket #1228 marked as resolved', time: '1h ago', unread: false },
    { id: 4, type: 'alert', message: 'SLA breach alert for ticket #1220', time: '2h ago', unread: false },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="top-banner">
      <div className="banner-container">
        {/* Quick Search */}
        <div className={`quick-search ${searchFocused ? 'focused' : ''}`}>
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Quick search..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="search-kbd">Ctrl+K</kbd>
        </div>

        {/* Right Actions */}
        <div className="banner-actions">
          {/* Help Button */}
          <button className="banner-btn" title="Help & Documentation">
            <HelpCircle size={20} />
          </button>

          {/* Notifications */}
          <div className="notification-wrapper">
            <button 
              className="banner-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="dropdown notification-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button className="text-link">Mark all read</button>
                </div>
                <div className="dropdown-body">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`}>
                      <div className={`notification-dot ${notification.unread ? 'active' : ''}`}></div>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button className="text-link">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="user-menu-wrapper">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              title="User Menu"
            >
              <div className="user-avatar">NT</div>
              <div className="user-info">
                <span className="user-name">Nicolas Taveras</span>
                <span className="user-role">Admin</span>
              </div>
            </button>

            {showUserMenu && (
              <div className="dropdown user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-user-avatar">NT</div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">Nicolas Taveras</div>
                    <div className="dropdown-user-email">nicolas.taveras@company.com</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-body">
                  <button className="dropdown-item">
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-item">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-body">
                  <button className="dropdown-item logout">
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
