import { useState, useEffect } from 'react'
import { Users, Plus, Mail, Phone, Shield, MoreVertical, UserPlus, Search } from 'lucide-react'
import api from '../services/api'
import './TeamsManagement.css'

function TeamsManagement() {
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [activeView, setActiveView] = useState('teams')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockTeams = [
    { 
      id: 1, 
      name: 'Help Desk Team', 
      description: 'First-line support and ticket management',
      member_count: 8,
      active_tickets: 24,
      resolved_today: 15
    },
    { 
      id: 2, 
      name: 'Infrastructure Team', 
      description: 'Server, network, and infrastructure management',
      member_count: 5,
      active_tickets: 12,
      resolved_today: 8
    },
    { 
      id: 3, 
      name: 'Security Team', 
      description: 'Cybersecurity and compliance',
      member_count: 4,
      active_tickets: 6,
      resolved_today: 3
    }
  ]

  const mockMembers = [
    { id: 1, name: 'John Doe', email: 'john.doe@company.com', phone: '+1 234-567-8900', role: 'Team Lead', team: 'Help Desk Team', status: 'active', tickets_assigned: 12 },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@company.com', phone: '+1 234-567-8901', role: 'Senior Technician', team: 'Infrastructure Team', status: 'active', tickets_assigned: 8 },
    { id: 3, name: 'Mike Johnson', email: 'mike.j@company.com', phone: '+1 234-567-8902', role: 'Technician', team: 'Help Desk Team', status: 'active', tickets_assigned: 15 },
    { id: 4, name: 'Sarah Williams', email: 'sarah.w@company.com', phone: '+1 234-567-8903', role: 'Security Analyst', team: 'Security Team', status: 'active', tickets_assigned: 5 },
    { id: 5, name: 'Tom Brown', email: 'tom.brown@company.com', phone: '+1 234-567-8904', role: 'Network Admin', team: 'Infrastructure Team', status: 'away', tickets_assigned: 6 }
  ]

  useEffect(() => {
    // Use mock data for now
    setTeams(mockTeams)
    setMembers(mockMembers)
    // fetchTeams()
  }, [])

  const fetchTeams = async () => {
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Already using mock data
      return
    }

    try {
      const response = await api.get('/teams/')
      setTeams(response.data.teams)
      setLoading(false)
    } catch (error) {
      // Silently continue with mock data
      setLoading(false)
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      'Team Lead': 'badge-primary',
      'Senior Technician': 'badge-success',
      'Technician': 'badge-gray',
      'Security Analyst': 'badge-danger',
      'Network Admin': 'badge-warning'
    }
    return colors[role] || 'badge-gray'
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.team.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading-spinner">Loading teams...</div>

  return (
    <div className="teams-management fade-in">
      <div className="page-header card">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Users size={28} />
            </div>
            <div>
              <h2 className="page-title">Teams Management</h2>
              <p className="page-subtitle">Manage teams and team members</p>
            </div>
          </div>
          <button className="btn btn-primary">
            <Plus size={18} />
            {activeView === 'teams' ? 'New Team' : 'Add Member'}
          </button>
        </div>
      </div>

      <div className="view-tabs card">
        <button 
          className={`tab-button ${activeView === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveView('teams')}
        >
          <Users size={18} />
          Teams
          <span className="tab-count">{teams.length}</span>
        </button>
        <button 
          className={`tab-button ${activeView === 'members' ? 'active' : ''}`}
          onClick={() => setActiveView('members')}
        >
          <UserPlus size={18} />
          Team Members
          <span className="tab-count">{members.length}</span>
        </button>
      </div>

      {activeView === 'teams' && (
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card card">
              <div className="team-header">
                <div className="team-icon">
                  <Users size={24} />
                </div>
                <button className="team-menu-btn">
                  <MoreVertical size={18} />
                </button>
              </div>
              <h3 className="team-name">{team.name}</h3>
              <p className="team-description">{team.description}</p>
              <div className="team-stats">
                <div className="stat-item">
                  <span className="stat-value">{team.member_count}</span>
                  <span className="stat-label">Members</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.active_tickets}</span>
                  <span className="stat-label">Active</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{team.resolved_today}</span>
                  <span className="stat-label">Resolved</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeView === 'members' && (
        <div className="members-section">
          <div className="members-toolbar card">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="members-table-container card">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-info">
                        <div className="member-avatar">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{member.email}</span>
                        </div>
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleColor(member.role)}`}>
                        <Shield size={14} />
                        {member.role}
                      </span>
                    </td>
                    <td>{member.team}</td>
                    <td>
                      <span className={`status-badge status-${member.status}`}>
                        {member.status}
                      </span>
                    </td>
                    <td>
                      <strong>{member.tickets_assigned}</strong> assigned
                    </td>
                    <td>
                      <button className="btn btn-sm btn-ghost">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamsManagement
