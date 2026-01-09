import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAPI } from '../../shared/src/hooks/useAPI'
import { TicketForm } from '../../shared/src/components/forms.js'
import { LoadingSpinner, ErrorMessage } from '../../shared/src/components/index.js'
import './CreateTicket.css'

function CreateTicket() {
  const navigate = useNavigate()
  const api = useAPI()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.post('/tickets/', formData)
      navigate('/tickets')
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/tickets')
  }

  return (
    <div className="create-ticket">
      <div className="create-ticket-header">
        <h1>Create New Ticket</h1>
      </div>
      
      <div className="create-ticket-content">
        <div className="ticket-form-container">
          {error && <ErrorMessage error={error} className="mb-4" />}
          
          <TicketForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            companies={[]} // TODO: Fetch companies from API
            isSubmitting={loading}
          />
        </div>
      </div>
    </div>
  )
}
      navigate('/tickets')
      setLoading(false)
      return
    }

    try {
      const response = await ticketAPI.createTicket(formData)
      const ticketId = response.data.ticket_id || response.data.id
      alert(`Ticket created successfully! Ticket #${response.data.ticket_number || ticketId}`)
      navigate(`/ticket/${ticketId}`)
    } catch (error) {
      console.error('API Error:', error)
      alert('Failed to create ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplate = async (templateId) => {
    // Check if authenticated
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Mock templates for demo
      return
    }

    try {
      const response = await ticketAPI.applyTemplate(templateId)
      setFormData({
        ...formData,
        title: response.data.title,
        description: response.data.description,
        category: response.data.category
      })
    } catch (error) {
      // Silently ignore for demo
    }
  }

  return (
    <div className="create-ticket-container">
      <div className="create-header">
        <h1>Create New Ticket</h1>
        <button onClick={() => navigate('/')} className="cancel-btn">Cancel</button>
      </div>

      <div className="create-grid">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue, including steps to reproduce and expected behavior"
              rows="8"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="general">General</option>
                <option value="email">Email</option>
                <option value="network">Network</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>

        <div className="templates-sidebar">
          <h3>Quick Templates</h3>
          <p className="templates-desc">Use a template to quickly fill in common ticket types</p>
          
          <div className="template-list">
            <button className="template-card" onClick={() => loadTemplate('email-issue')}>
              <div className="template-icon">📧</div>
              <div className="template-info">
                <h4>Email Issue</h4>
                <p>Can't send/receive emails</p>
              </div>
            </button>

            <button className="template-card" onClick={() => loadTemplate('password-reset')}>
              <div className="template-icon">🔐</div>
              <div className="template-info">
                <h4>Password Reset</h4>
                <p>User account password reset request</p>
              </div>
            </button>

            <button className="template-card" onClick={() => loadTemplate('software-install')}>
              <div className="template-icon">💻</div>
              <div className="template-info">
                <h4>Software Installation</h4>
                <p>Request new software installation</p>
              </div>
            </button>

            <button className="template-card" onClick={() => loadTemplate('network-issue')}>
              <div className="template-icon">🌐</div>
              <div className="template-info">
                <h4>Network Issue</h4>
                <p>Internet/network connectivity problem</p>
              </div>
            </button>

            <button className="template-card" onClick={() => loadTemplate('hardware-issue')}>
              <div className="template-icon">🖥️</div>
              <div className="template-info">
                <h4>Hardware Issue</h4>
                <p>Computer or peripheral malfunction</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateTicket
