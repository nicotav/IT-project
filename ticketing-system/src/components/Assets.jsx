import { useState } from 'react'
import { 
  Monitor, 
  Server, 
  Laptop, 
  Printer, 
  HardDrive,
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react'
import './Assets.css'

function Assets() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const assets = [
    { 
      id: 'AST-001', 
      name: 'Dell PowerEdge R740', 
      type: 'server', 
      status: 'active',
      location: 'Data Center A',
      assignedTo: 'Infrastructure Team',
      purchaseDate: '2024-06-15',
      warranty: '2027-06-15'
    },
    { 
      id: 'AST-002', 
      name: 'HP EliteBook 840', 
      type: 'laptop', 
      status: 'active',
      location: 'Office Floor 2',
      assignedTo: 'Nicolas Taveras',
      purchaseDate: '2025-01-10',
      warranty: '2028-01-10'
    },
    { 
      id: 'AST-003', 
      name: 'HP LaserJet Pro 400', 
      type: 'printer', 
      status: 'maintenance',
      location: 'Office Floor 3',
      assignedTo: 'General Use',
      purchaseDate: '2023-11-20',
      warranty: '2024-11-20'
    },
    { 
      id: 'AST-004', 
      name: 'Dell Monitor U2720Q', 
      type: 'monitor', 
      status: 'active',
      location: 'Office Floor 2',
      assignedTo: 'John Doe',
      purchaseDate: '2025-03-05',
      warranty: '2028-03-05'
    },
    { 
      id: 'AST-005', 
      name: 'Synology NAS DS920+', 
      type: 'storage', 
      status: 'active',
      location: 'Data Center B',
      assignedTo: 'Backup Team',
      purchaseDate: '2024-08-12',
      warranty: '2026-08-12'
    },
    { 
      id: 'AST-006', 
      name: 'Lenovo ThinkPad X1', 
      type: 'laptop', 
      status: 'retired',
      location: 'Storage',
      assignedTo: 'Unassigned',
      purchaseDate: '2021-05-20',
      warranty: '2024-05-20'
    },
  ]

  const getIcon = (type) => {
    switch(type) {
      case 'server': return <Server size={18} />
      case 'laptop': return <Laptop size={18} />
      case 'monitor': return <Monitor size={18} />
      case 'printer': return <Printer size={18} />
      case 'storage': return <HardDrive size={18} />
      default: return <Package size={18} />
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'badge-success'
      case 'maintenance': return 'badge-warning'
      case 'retired': return 'badge-gray'
      default: return 'badge-gray'
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || asset.type === filterType
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: assets.length,
    active: assets.filter(a => a.status === 'active').length,
    maintenance: assets.filter(a => a.status === 'maintenance').length,
    retired: assets.filter(a => a.status === 'retired').length
  }

  return (
    <div className="assets-container">
      <div className="assets-header">
        <div>
          <h1>IT Assets Management</h1>
          <p className="assets-subtitle">Track and manage company IT assets and equipment</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white'}}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Assets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white'}}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.maintenance}</div>
            <div className="stat-label">Maintenance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #6b7280, #4b5563)', color: 'white'}}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.retired}</div>
            <div className="stat-label">Retired</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="assets-filters card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              <option value="server">Servers</option>
              <option value="laptop">Laptops</option>
              <option value="monitor">Monitors</option>
              <option value="printer">Printers</option>
              <option value="storage">Storage</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets List */}
      <div className="assets-list card">
        <table className="table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Location</th>
              <th>Assigned To</th>
              <th>Purchase Date</th>
              <th>Warranty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map(asset => (
              <tr key={asset.id}>
                <td><span className="asset-id">{asset.id}</span></td>
                <td>
                  <div className="asset-name">
                    {getIcon(asset.type)}
                    <span>{asset.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-primary">{asset.type}</span></td>
                <td>
                  <span className={`badge ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.location}</td>
                <td>{asset.assignedTo}</td>
                <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                <td>
                  {new Date(asset.warranty) > new Date() ? (
                    <span className="warranty-valid">{new Date(asset.warranty).toLocaleDateString()}</span>
                  ) : (
                    <span className="warranty-expired">Expired</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="btn-icon" title="Delete">
                      <Trash2 size={16} />
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

export default Assets
