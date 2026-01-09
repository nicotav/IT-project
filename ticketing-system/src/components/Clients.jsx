import { useState } from 'react'
import { 
  Building2, 
  Users, 
  Package, 
  Plus, 
  Search,
  Phone,
  Mail,
  MapPin,
  User,
  X,
  Edit,
  Trash2,
  Monitor,
  Server,
  Laptop,
  Printer,
  HardDrive,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import './Clients.css'

function Clients() {
  const [activeTab, setActiveTab] = useState('clients') // 'clients' or 'assets'
  const [selectedClient, setSelectedClient] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [showNewAssetModal, setShowNewAssetModal] = useState(false)
  const [showEditClientModal, setShowEditClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  
  const [clients, setClients] = useState([
    { 
      id: 1, 
      name: 'Acme Corporation', 
      contact: 'Alice Johnson',
      email: 'alice@acme.com', 
      phone: '(555) 123-4567',
      address: '123 Tech Street, NY 10001',
      industry: 'Technology',
      itManager: 'Nicolas Taveras',
      status: 'active',
      assets: 45,
      tickets: 12,
      revenue: 45000,
      lastContact: '2026-01-18'
    },
    { 
      id: 2, 
      name: 'Tech Solutions Inc', 
      contact: 'Bob Williams',
      email: 'bob@techsolutions.com', 
      phone: '(555) 234-5678',
      address: '456 Business Ave, CA 90210',
      industry: 'IT Services',
      itManager: 'John Doe',
      status: 'active',
      assets: 32,
      tickets: 8,
      revenue: 67000,
      lastContact: '2026-01-19'
    },
    { 
      id: 3, 
      name: 'Creative Agency', 
      contact: 'Carol Davis',
      email: 'carol@creative.com', 
      phone: '(555) 345-6789',
      address: '789 Design Blvd, FL 33101',
      industry: 'Marketing',
      itManager: 'Jane Smith',
      status: 'active',
      assets: 18,
      tickets: 5,
      revenue: 32000,
      lastContact: '2026-01-17'
    },
    { 
      id: 4, 
      name: 'Remote Services LLC', 
      contact: 'David Martinez',
      email: 'david@remote.com', 
      phone: '(555) 456-7890',
      address: '321 Cloud Lane, TX 75001',
      industry: 'Consulting',
      itManager: 'Nicolas Taveras',
      status: 'active',
      assets: 25,
      tickets: 10,
      revenue: 40000,
      lastContact: '2026-01-16'
    }
  ])

  const [assets, setAssets] = useState([
    { id: 'AST-001', name: 'Dell PowerEdge R740', type: 'server', status: 'active', location: 'Data Center A', company: 'Acme Corporation', assignedTo: 'Infrastructure Team', warranty: '2027-06-15' },
    { id: 'AST-002', name: 'HP EliteBook 840', type: 'laptop', status: 'active', location: 'Office Floor 2', company: 'Acme Corporation', assignedTo: 'Alice Johnson', warranty: '2028-01-10' },
    { id: 'AST-003', name: 'HP LaserJet Pro 400', type: 'printer', status: 'maintenance', location: 'Office Floor 3', company: 'Tech Solutions Inc', assignedTo: 'Print Room', warranty: '2026-08-20' },
    { id: 'AST-004', name: 'Cisco Catalyst 2960', type: 'server', status: 'active', location: 'Server Room', company: 'Tech Solutions Inc', assignedTo: 'Network Team', warranty: '2027-12-01' },
    { id: 'AST-005', name: 'Lenovo ThinkPad X1', type: 'laptop', status: 'active', location: 'Office Floor 1', company: 'Creative Agency', assignedTo: 'Carol Davis', warranty: '2027-04-15' },
    { id: 'AST-006', name: 'Synology DS920+', type: 'storage', status: 'active', location: 'Data Center B', company: 'Remote Services LLC', assignedTo: 'Storage Team', warranty: '2028-03-10' },
  ])

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const clientAssets = selectedClient ? assets.filter(a => a.company === selectedClient.name) : []

  const getAssetIcon = (type) => {
    switch(type) {
      case 'server': return <Server size={18} />
      case 'laptop': return <Laptop size={18} />
      case 'printer': return <Printer size={18} />
      case 'storage': return <HardDrive size={18} />
      default: return <Monitor size={18} />
    }
  }

  const handleAddClient = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newClient = {
      id: clients.length + 1,
      name: formData.get('name'),
      contact: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      industry: formData.get('industry'),
      itManager: formData.get('itManager'),
      status: 'active',
      assets: 0,
      tickets: 0,
      revenue: 0,
      lastContact: new Date().toISOString().split('T')[0]
    }
    setClients([...clients, newClient])
    setShowNewClientModal(false)
    alert('Client added successfully!')
  }

  const handleEditClient = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const updatedClient = {
      ...editingClient,
      name: formData.get('name'),
      contact: formData.get('contact'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      industry: formData.get('industry'),
      itManager: formData.get('itManager')
    }
    setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c))
    setShowEditClientModal(false)
    setEditingClient(null)
    alert('Client updated successfully!')
  }

  const handleDeleteClient = (clientId) => {
    if (confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(c => c.id !== clientId))
      if (selectedClient?.id === clientId) setSelectedClient(null)
      alert('Client deleted successfully!')
    }
  }

  const handleAddAsset = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newAsset = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name: formData.get('name'),
      type: formData.get('type'),
      status: formData.get('status'),
      location: formData.get('location'),
      company: formData.get('company'),
      assignedTo: formData.get('assignedTo'),
      warranty: formData.get('warranty')
    }
    setAssets([...assets, newAsset])
    setShowNewAssetModal(false)
    alert('Asset added successfully!')
  }

  const handleDeleteAsset = (assetId) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      setAssets(assets.filter(a => a.id !== assetId))
      alert('Asset deleted successfully!')
    }
  }

  const stats = {
    total: filteredClients.length,
    active: filteredClients.filter(c => c.status === 'active').length,
    totalRevenue: filteredClients.reduce((sum, c) => sum + c.revenue, 0),
    avgTickets: Math.round(filteredClients.reduce((sum, c) => sum + c.tickets, 0) / filteredClients.length)
  }

  const assetStats = {
    total: filteredAssets.length,
    active: filteredAssets.filter(a => a.status === 'active').length,
    maintenance: filteredAssets.filter(a => a.status === 'maintenance').length
  }

  return (
    <div className="clients-container">
      {/* Header */}
      <div className="clients-header">
        <div>
          <h1>Client Management</h1>
          <p className="clients-subtitle">Manage clients, contacts, and IT assets</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => activeTab === 'clients' ? setShowNewClientModal(true) : setShowNewAssetModal(true)}
        >
          <Plus size={18} />
          {activeTab === 'clients' ? 'New Client' : 'New Asset'}
        </button>
      </div>

      {/* Tabs */}
      <div className="clients-tabs">
        <button 
          className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Building2 size={18} />
          Clients ({clients.length})
        </button>
        <button 
          className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <Package size={18} />
          Assets ({assets.length})
        </button>
      </div>

      {/* Search */}
      <div className="clients-search card">
        <Search size={18} />
        <input 
          type="text"
          placeholder={`Search ${activeTab === 'clients' ? 'clients' : 'assets'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {activeTab === 'clients' ? (
        <>
          {/* Stats */}
          <div className="clients-stats">
            <div className="stat-card">
              <div className="stat-icon"><Building2 size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Clients</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Users size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">${(stats.totalRevenue / 1000).toFixed(0)}K</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Package size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{stats.avgTickets}</div>
                <div className="stat-label">Avg Tickets</div>
              </div>
            </div>
          </div>

          {/* Client List/Detail View */}
          <div className="clients-layout">
            <div className="clients-list card">
              {filteredClients.map(client => (
                <div 
                  key={client.id} 
                  className={`client-item ${selectedClient?.id === client.id ? 'selected' : ''}`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="client-avatar">
                    <Building2 size={24} />
                  </div>
                  <div className="client-info">
                    <div className="client-name">{client.name}</div>
                    <div className="client-contact">{client.contact}</div>
                    <div className="client-meta">
                      <span>{client.industry}</span>
                      <span>•</span>
                      <span>{client.assets} assets</span>
                      <span>•</span>
                      <span>{client.tickets} tickets</span>
                    </div>
                  </div>
                  <div className="client-actions">
                    <button 
                      className="btn btn-icon btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingClient(client)
                        setShowEditClientModal(true)
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn btn-icon btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClient(client.id)
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedClient && (
              <div className="client-detail card">
                <div className="detail-header">
                  <div>
                    <h2>{selectedClient.name}</h2>
                    <span className="badge badge-success">{selectedClient.status}</span>
                  </div>
                  <button className="btn btn-icon btn-ghost" onClick={() => setSelectedClient(null)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="detail-section">
                  <h3>Contact Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <User size={16} />
                      <div>
                        <div className="detail-label">Primary Contact</div>
                        <div className="detail-value">{selectedClient.contact}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Mail size={16} />
                      <div>
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{selectedClient.email}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Phone size={16} />
                      <div>
                        <div className="detail-label">Phone</div>
                        <div className="detail-value">{selectedClient.phone}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} />
                      <div>
                        <div className="detail-label">Address</div>
                        <div className="detail-value">{selectedClient.address}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <User size={16} />
                      <div>
                        <div className="detail-label">IT Manager</div>
                        <div className="detail-value">{selectedClient.itManager}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Assets ({clientAssets.length})</h3>
                  <div className="asset-list">
                    {clientAssets.length > 0 ? (
                      clientAssets.map(asset => (
                        <div key={asset.id} className="asset-item">
                          <div className="asset-icon">{getAssetIcon(asset.type)}</div>
                          <div className="asset-info">
                            <div className="asset-name">{asset.name}</div>
                            <div className="asset-meta">{asset.id} • {asset.assignedTo}</div>
                          </div>
                          <span className={`badge ${asset.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                            {asset.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state-small">No assets found for this client</div>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <div className="stat-number">{selectedClient.tickets}</div>
                      <div className="stat-text">Open Tickets</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-number">${(selectedClient.revenue / 1000).toFixed(0)}K</div>
                      <div className="stat-text">Revenue</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-number">{selectedClient.assets}</div>
                      <div className="stat-text">Assets</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Asset Stats */}
          <div className="clients-stats">
            <div className="stat-card">
              <div className="stat-icon"><Package size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{assetStats.total}</div>
                <div className="stat-label">Total Assets</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{assetStats.active}</div>
                <div className="stat-label">Active</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><AlertTriangle size={24} /></div>
              <div className="stat-content">
                <div className="stat-value">{assetStats.maintenance}</div>
                <div className="stat-label">Maintenance</div>
              </div>
            </div>
          </div>

          {/* Asset Table */}
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Warranty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => (
                    <tr key={asset.id}>
                      <td><span className="asset-id">{asset.id}</span></td>
                      <td>
                        <div className="asset-name-cell">
                          {getAssetIcon(asset.type)}
                          {asset.name}
                        </div>
                      </td>
                      <td><span className="badge badge-gray">{asset.type}</span></td>
                      <td>{asset.company}</td>
                      <td>{asset.location}</td>
                      <td>{asset.assignedTo}</td>
                      <td>
                        <span className={`badge ${asset.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td>
                        <span className={new Date(asset.warranty) > new Date() ? 'warranty-valid' : 'warranty-expired'}>
                          {asset.warranty}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-icon btn-ghost"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="modal-overlay" onClick={() => setShowNewClientModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Client</h3>
              <button className="btn-icon" onClick={() => setShowNewClientModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddClient}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input type="text" name="industry" />
                </div>
                <div className="form-group">
                  <label>Primary Contact *</label>
                  <input type="text" name="contact" required />
                </div>
                <div className="form-group">
                  <label>IT Manager *</label>
                  <select name="itManager" required>
                    <option value="Nicolas Taveras">Nicolas Taveras</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" required />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" name="phone" required />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <input type="text" name="address" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewClientModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && editingClient && (
        <div className="modal-overlay" onClick={() => setShowEditClientModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Client</h3>
              <button className="btn-icon" onClick={() => setShowEditClientModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditClient}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input type="text" name="name" defaultValue={editingClient.name} required />
                </div>
                <div className="form-group">
                  <label>Industry</label>
                  <input type="text" name="industry" defaultValue={editingClient.industry} />
                </div>
                <div className="form-group">
                  <label>Primary Contact *</label>
                  <input type="text" name="contact" defaultValue={editingClient.contact} required />
                </div>
                <div className="form-group">
                  <label>IT Manager *</label>
                  <select name="itManager" defaultValue={editingClient.itManager} required>
                    <option value="Nicolas Taveras">Nicolas Taveras</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" name="email" defaultValue={editingClient.email} required />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" name="phone" defaultValue={editingClient.phone} required />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <input type="text" name="address" defaultValue={editingClient.address} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditClientModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Asset Modal */}
      {showNewAssetModal && (
        <div className="modal-overlay" onClick={() => setShowNewAssetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Asset</h3>
              <button className="btn-icon" onClick={() => setShowNewAssetModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAsset}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Asset Name *</label>
                  <input type="text" name="name" required />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select name="type" required>
                    <option value="server">Server</option>
                    <option value="laptop">Laptop</option>
                    <option value="printer">Printer</option>
                    <option value="storage">Storage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Company *</label>
                  <select name="company" required>
                    {clients.map(client => (
                      <option key={client.id} value={client.name}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input type="text" name="location" required />
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input type="text" name="assignedTo" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status">
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Warranty Expiry</label>
                  <input type="date" name="warranty" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewAssetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients
