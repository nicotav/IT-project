import { useState, useEffect } from 'react'
import { Building2, HardDrive, Plus, Search, MoreVertical, Phone, Mail, MapPin, Calendar, DollarSign } from 'lucide-react'
import api from '../services/api'
import './CompanyAssets.css'

function CompanyAssets() {
  const [activeTab, setActiveTab] = useState('companies')
  const [companies, setCompanies] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [showNewAsset, setShowNewAsset] = useState(false)

  useEffect(() => {
    if (activeTab === 'companies') {
      fetchCompanies()
    } else {
      fetchAssets()
    }
  }, [activeTab])

  const fetchCompanies = async () => {
    setLoading(true)
    
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      setCompanies(mockCompanies)
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/companies/')
      setCompanies(response.data.companies || mockCompanies)
      setLoading(false)
    } catch (error) {
      // Silently use mock data for development
      setCompanies(mockCompanies)
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    setLoading(true)
    
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      setAssets(mockAssets)
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/companies/assets')
      setAssets(response.data.assets || mockAssets)
      setLoading(false)
    } catch (error) {
      // Silently use mock data for development
      setAssets(mockAssets)
      setLoading(false)
    }
  }

  const mockCompanies = [
    { id: 1, name: 'Acme Corporation', industry: 'Technology', phone: '(555) 123-4567', email: 'contact@acme.com', address: '123 Tech Street', asset_count: 45, ticket_count: 12, status: 'active' },
    { id: 2, name: 'Tech Solutions Inc', industry: 'IT Services', phone: '(555) 234-5678', email: 'info@techsolutions.com', address: '456 Business Ave', asset_count: 32, ticket_count: 8, status: 'active' },
    { id: 3, name: 'Creative Agency', industry: 'Marketing', phone: '(555) 345-6789', email: 'hello@creative.com', address: '789 Design Blvd', asset_count: 18, ticket_count: 5, status: 'active' },
  ]

  const mockAssets = [
    { id: 1, name: 'Dell Latitude 5420', type: 'Laptop', serial: 'DL-2024-001', company: 'Acme Corporation', warranty_expiry: '2025-06-15', status: 'active', value: '$1,200' },
    { id: 2, name: 'HP ProDesk 600 G6', type: 'Desktop', serial: 'HP-2024-045', company: 'Tech Solutions Inc', warranty_expiry: '2025-12-01', status: 'active', value: '$950' },
    { id: 3, name: 'iPhone 14 Pro', type: 'Mobile', serial: 'IPH-2024-123', company: 'Creative Agency', warranty_expiry: '2025-03-20', status: 'active', value: '$1,100' },
    { id: 4, name: 'Cisco Catalyst 2960', type: 'Network', serial: 'CSC-2024-789', company: 'Acme Corporation', warranty_expiry: '2026-01-10', status: 'active', value: '$800' },
  ]

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.serial.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="company-assets fade-in">
      <div className="page-header card">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              {activeTab === 'companies' ? <Building2 size={28} /> : <HardDrive size={28} />}
            </div>
            <div>
              <h2 className="page-title">Company & Asset Management</h2>
              <p className="page-subtitle">Manage client companies and their IT assets</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => activeTab === 'companies' ? setShowNewCompany(true) : setShowNewAsset(true)}>
            <Plus size={18} />
            {activeTab === 'companies' ? 'New Company' : 'New Asset'}
          </button>
        </div>
      </div>

      <div className="tabs-container card">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <Building2 size={18} />
            Companies
            <span className="tab-badge">{companies.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <HardDrive size={18} />
            Assets
            <span className="tab-badge">{assets.length}</span>
          </button>
        </div>

        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="content-section">
        {activeTab === 'companies' ? (
          <div className="companies-grid">
            {filteredCompanies.map(company => (
              <div key={company.id} className="company-card card">
                <div className="company-header">
                  <div className="company-avatar">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <button className="btn-icon btn-ghost">
                    <MoreVertical size={18} />
                  </button>
                </div>
                <h3 className="company-name">{company.name}</h3>
                <span className="badge badge-primary badge-sm">{company.industry}</span>
                <div className="company-details">
                  <div className="detail-item">
                    <Phone size={14} />
                    <span>{company.phone}</span>
                  </div>
                  <div className="detail-item">
                    <Mail size={14} />
                    <span>{company.email}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={14} />
                    <span>{company.address}</span>
                  </div>
                </div>
                <div className="company-stats">
                  <div className="stat-item">
                    <span className="stat-value">{company.asset_count}</span>
                    <span className="stat-label">Assets</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{company.ticket_count}</span>
                    <span className="stat-label">Tickets</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-container card">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Serial Number</th>
                  <th>Company</th>
                  <th>Warranty</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr key={asset.id}>
                    <td>
                      <div className="asset-name">
                        <HardDrive size={16} />
                        <span>{asset.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-gray badge-sm">{asset.type}</span></td>
                    <td><code className="text-xs">{asset.serial}</code></td>
                    <td>{asset.company}</td>
                    <td>
                      <div className="warranty-cell">
                        <Calendar size={14} />
                        {asset.warranty_expiry}
                      </div>
                    </td>
                    <td>
                      <span className="value-cell">
                        <DollarSign size={14} />
                        {asset.value}
                      </span>
                    </td>
                    <td><span className="badge badge-success badge-sm">{asset.status}</span></td>
                    <td>
                      <button className="btn-icon btn-ghost">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyAssets
