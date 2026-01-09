import { useState } from 'react'
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import './CRM.css'

function CRM() {
  const [viewMode, setViewMode] = useState('list') // 'list' or 'cards'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const customers = [
    { 
      id: 1, 
      name: 'Acme Corporation', 
      contact: 'Alice Johnson', 
      email: 'alice@acme.com', 
      phone: '+1 (555) 123-4567',
      address: '123 Business St, NY',
      status: 'active',
      tickets: 15,
      revenue: 45000,
      lastContact: '2026-01-18'
    },
    { 
      id: 2, 
      name: 'Tech Solutions Inc', 
      contact: 'Bob Williams', 
      email: 'bob@techsolutions.com', 
      phone: '+1 (555) 234-5678',
      address: '456 Tech Ave, CA',
      status: 'active',
      tickets: 23,
      revenue: 67000,
      lastContact: '2026-01-19'
    },
    { 
      id: 3, 
      name: 'Creative Agency', 
      contact: 'Carol Davis', 
      email: 'carol@creativeagency.com', 
      phone: '+1 (555) 345-6789',
      address: '789 Design Blvd, TX',
      status: 'active',
      tickets: 8,
      revenue: 28000,
      lastContact: '2026-01-15'
    },
    { 
      id: 4, 
      name: 'Remote Services LLC', 
      contact: 'David Martinez', 
      email: 'david@remoteservices.com', 
      phone: '+1 (555) 456-7890',
      address: '321 Remote Way, FL',
      status: 'inactive',
      tickets: 5,
      revenue: 12000,
      lastContact: '2025-12-20'
    },
  ]

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.revenue, 0),
    avgTickets: Math.round(customers.reduce((sum, c) => sum + c.tickets, 0) / customers.length)
  }

  return (
    <div className="crm-container">
      <div className="crm-header">
        <div>
          <h1>CRM - Customer Relationship Management</h1>
          <p className="crm-subtitle">Manage customer relationships and track interactions</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white'}}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Customers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white'}}>
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active Customers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white'}}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white'}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgTickets}</div>
            <div className="stat-label">Avg Tickets</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="crm-filters card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-ghost">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="customers-list card">
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Tickets</th>
              <th>Revenue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className="customer-name">
                    <Building2 size={16} />
                    <span>{customer.name}</span>
                  </div>
                </td>
                <td>{customer.contact}</td>
                <td>
                  <a href={`mailto:${customer.email}`} className="link-text">{customer.email}</a>
                </td>
                <td>{customer.phone}</td>
                <td><span className="badge badge-primary">{customer.tickets}</span></td>
                <td><strong>${(customer.revenue / 1000).toFixed(1)}K</strong></td>
                <td>
                  <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                    {customer.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon" title="More">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CRM
