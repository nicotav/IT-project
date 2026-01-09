import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { User, X, Plus, AlertCircle, Clock, Calendar, ExternalLink } from 'lucide-react'
import { ticketAPI } from '../services/api'
import './KanbanBoard.css'

function KanbanBoard() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [newAssignee, setNewAssignee] = useState('')

  const columns = [
    { id: 'unassigned', title: 'Unassigned', status: 'new' },
    { id: 'nicolas', title: 'Nicolas Taveras', assignee: 'Nicolas Taveras' },
    { id: 'john', title: 'John Doe', assignee: 'John Doe' },
    { id: 'jane', title: 'Jane Smith', assignee: 'Jane Smith' },
    { id: 'techteam', title: 'Tech Team', assignee: 'Tech Team' }
  ]

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    
    // Check if authenticated before making API calls
    const token = localStorage.getItem('token')
    
    if (!token) {
      // Use mock data if no authentication
      loadMockTickets()
      setLoading(false)
      return
    }

    try {
      const response = await ticketAPI.getTickets()
      // Map backend fields to frontend expectations
      const apiTickets = (response.data?.tickets || response.data || []).map(ticket => ({
        ...ticket,
        assignee: ticket.assigned_to || 'Unassigned',
        company: ticket.company_id || 'Unknown'
      }))
      setTickets(apiTickets)
      setLoading(false)
    } catch (error) {
      console.error('API Error:', error)
      // Silently use mock data for development
      loadMockTickets()
      setLoading(false)
    }
  }

  const loadMockTickets = () => {
    const mockTickets = [
      { id: 1001, title: 'Email server not responding', status: 'new', priority: 'critical', assignee: 'Unassigned', created_at: new Date().toISOString(), company: 'Acme Corp' },
      { id: 1002, title: 'User cannot access shared drive', status: 'in-progress', priority: 'high', assignee: 'Nicolas Taveras', created_at: new Date().toISOString(), company: 'Tech Solutions' },
      { id: 1003, title: 'Printer queue stuck', status: 'in-progress', priority: 'medium', assignee: 'John Doe', created_at: new Date().toISOString(), company: 'Acme Corp' },
      { id: 1004, title: 'VPN connection issues', status: 'new', priority: 'high', assignee: 'Unassigned', created_at: new Date().toISOString(), company: 'Remote Services' },
      { id: 1005, title: 'Password reset request', status: 'resolved', priority: 'low', assignee: 'Jane Smith', created_at: new Date().toISOString(), company: 'Tech Solutions' },
      { id: 1006, title: 'Server backup failed', status: 'new', priority: 'critical', assignee: 'Unassigned', created_at: new Date().toISOString(), company: 'Internal' },
      { id: 1007, title: 'Software installation needed', status: 'new', priority: 'medium', assignee: 'Unassigned', created_at: new Date().toISOString(), company: 'Creative Agency' },
      { id: 1008, title: 'Network troubleshooting', status: 'in-progress', priority: 'high', assignee: 'Tech Team', created_at: new Date().toISOString(), company: 'Acme Corp' },
    ]
    
    // Load demo tickets from localStorage and merge
    const demoTickets = JSON.parse(localStorage.getItem('demoTickets') || '[]')
    setTickets([...mockTickets, ...demoTickets])
  }

  const getTicketsForColumn = (columnId) => {
    const column = columns.find(c => c.id === columnId)
    // Filter out closed and resolved tickets - only show open tickets
    const openTickets = tickets.filter(t => 
      t.status !== 'closed' && t.status !== 'resolved'
    )
    
    if (columnId === 'unassigned') {
      return openTickets.filter(t => t.assignee === 'Unassigned' || !t.assignee)
    }
    return openTickets.filter(t => t.assignee === column.assignee)
  }

  const onDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    if (source.droppableId === destination.droppableId) return

    const ticketId = parseInt(draggableId.replace('ticket-', ''))
    const ticket = tickets.find(t => t.id === ticketId)
    const destColumn = columns.find(c => c.id === destination.droppableId)

    // Update ticket assignee
    const newAssignee = destColumn.id === 'unassigned' ? 'Unassigned' : destColumn.assignee

    setTickets(prev => prev.map(t => 
      t.id === ticketId 
        ? { ...t, assignee: newAssignee, status: destColumn.id === 'unassigned' ? 'new' : 'in-progress' }
        : t
    ))

    // API call would go here
    console.log(`Ticket #${ticketId} assigned to ${newAssignee}`)
  }

  const handleUnassign = (ticketId) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId 
        ? { ...t, assignee: 'Unassigned', status: 'new' }
        : t
    ))
  }

  const handleAssignClick = (ticket) => {
    setSelectedTicket(ticket)
    setShowAssignModal(true)
  }

  const handleAssign = () => {
    if (!newAssignee || !selectedTicket) return

    setTickets(prev => prev.map(t => 
      t.id === selectedTicket.id 
        ? { ...t, assignee: newAssignee, status: 'in-progress' }
        : t
    ))

    setShowAssignModal(false)
    setSelectedTicket(null)
    setNewAssignee('')
  }

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    }
    return colors[priority] || '#6b7280'
  }

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading boards...</p>
      </div>
    )
  }

  return (
    <div className="kanban-board">
      <div className="kanban-header">
        <div>
          <h1>Ticket Boards</h1>
          <p className="kanban-subtitle">Assign and manage tickets by user</p>
        </div>
        <div className="kanban-stats">
          <div className="stat-badge">
            <AlertCircle size={16} />
            <span>{tickets.filter(t => (t.assignee === 'Unassigned' || !t.assignee) && t.status !== 'closed' && t.status !== 'resolved').length} unassigned</span>
          </div>
          <div className="stat-badge">
            <Clock size={16} />
            <span>{tickets.filter(t => t.status === 'in-progress').length} in progress</span>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-columns">
          {columns.map(column => {
            const columnTickets = getTicketsForColumn(column.id)
            return (
              <div key={column.id} className="kanban-column">
                <div className="column-header">
                  <div className="column-title">
                    {column.id === 'unassigned' ? (
                      <AlertCircle size={18} />
                    ) : (
                      <User size={18} />
                    )}
                    <span>{column.title}</span>
                  </div>
                  <div className="column-count">{columnTickets.length}</div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {columnTickets.map((ticket, index) => (
                        <Draggable
                          key={ticket.id}
                          draggableId={`ticket-${ticket.id}`}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`ticket-card ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <div className="ticket-card-header">
                                <span className="ticket-id">#{ticket.id}</span>
                                <div className="ticket-actions">
                                  <button
                                    className="btn-icon btn-view"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/ticket/${ticket.id}`)
                                    }}
                                    title="View Details"
                                  >
                                    <ExternalLink size={14} />
                                  </button>
                                  {column.id !== 'unassigned' && (
                                    <button
                                      className="btn-icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleUnassign(ticket.id)
                                      }}
                                      title="Unassign"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                  {column.id === 'unassigned' && (
                                    <button
                                      className="btn-icon"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAssignClick(ticket)
                                      }}
                                      title="Assign"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h3 className="ticket-title">{ticket.title}</h3>

                              <div className="ticket-meta">
                                <span
                                  className="priority-badge"
                                  style={{ background: getPriorityColor(ticket.priority) }}
                                >
                                  {ticket.priority}
                                </span>
                                <span className="ticket-company">{ticket.company}</span>
                              </div>

                              <div className="ticket-footer">
                                <div className="ticket-time">
                                  <Calendar size={12} />
                                  <span>{formatTimeAgo(ticket.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Ticket</h2>
              <button className="btn-icon" onClick={() => setShowAssignModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Assign ticket #{selectedTicket?.id} - {selectedTicket?.title}</p>
              <div className="form-field">
                <label>Assignee</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="form-select"
                >
                  <option value="">Select assignee...</option>
                  <option value="Nicolas Taveras">Nicolas Taveras</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Tech Team">Tech Team</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssign}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KanbanBoard
