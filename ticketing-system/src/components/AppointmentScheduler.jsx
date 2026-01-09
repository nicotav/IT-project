import { useState } from 'react'
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Plus, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  X 
} from 'lucide-react'
import './AppointmentScheduler.css'

function AppointmentScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [appointments, setAppointments] = useState([
    { id: 1, date: '2026-01-20', time: '09:00', title: 'Server Maintenance', client: 'Acme Corp', tech: 'Nicolas Taveras', type: 'onsite', description: 'Routine server maintenance and updates' },
    { id: 2, date: '2026-01-22', time: '14:00', title: 'Network Setup', client: 'Tech Solutions', tech: 'John Doe', type: 'remote', description: 'Configure new network infrastructure' },
    { id: 3, date: '2026-01-25', time: '10:30', title: 'Software Install', client: 'Creative Agency', tech: 'Jane Smith', type: 'onsite', description: 'Install Adobe Creative Cloud suite' },
  ])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getAppointmentsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => apt.date === dateStr)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleCreateAppointment = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newAppointment = {
      id: appointments.length + 1,
      title: formData.get('title'),
      client: formData.get('client'),
      tech: formData.get('tech'),
      date: formData.get('date'),
      time: formData.get('time'),
      type: formData.get('type'),
      description: formData.get('description') || ''
    }
    setAppointments([...appointments, newAppointment])
    setShowNewModal(false)
    alert('Appointment created successfully!')
    e.target.reset()
  }

  const handleAppointmentClick = (apt) => {
    setSelectedAppointment(apt)
    setShowDetailModal(true)
  }

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="appointment-scheduler">
      <div className="scheduler-header">
        <div>
          <h1>Appointment Scheduler</h1>
          <p className="scheduler-subtitle">Manage technician schedules and appointments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus size={18} />
          New Appointment
        </button>
      </div>

      <div className="calendar-container card">
        <div className="calendar-nav">
          <button className="btn btn-ghost" onClick={previousMonth}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendar-title">{monthYear}</h2>
          <button className="btn btn-ghost" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {days.map((day, index) => {
            const dayAppointments = day ? getAppointmentsForDate(day) : []
            const isToday = day && day.toDateString() === new Date().toDateString()
            return (
              <div
                key={index}
                className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => day && setSelectedDate(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day.getDate()}</span>
                    {dayAppointments.length > 0 && (
                      <div className="day-appointments">
                        {dayAppointments.slice(0, 2).map(apt => (
                          <div 
                            key={apt.id} 
                            className="day-appointment-dot" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAppointmentClick(apt)
                            }}
                          >
                            <span className="apt-time">{apt.time}</span>
                            <span className="apt-with">w/ {apt.client}</span>
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="day-more">+{dayAppointments.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="appointments-list card">
          <h3>Appointments for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
          <div className="appointments-items">
            {getAppointmentsForDate(selectedDate).map(apt => (
              <div key={apt.id} className="appointment-card">
                <div className="appointment-time">
                  <Clock size={16} />
                  <span>{apt.time}</span>
                </div>
                <div className="appointment-details">
                  <h4>{apt.title}</h4>
                  <div className="appointment-meta">
                    <div className="meta-item">
                      <Users size={14} />
                      <span>{apt.client}</span>
                    </div>
                    <div className="meta-item">
                      <Users size={14} />
                      <span>{apt.tech}</span>
                    </div>
                    <div className="meta-item">
                      {apt.type === 'remote' ? <Video size={14} /> : <MapPin size={14} />}
                      <span>{apt.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {getAppointmentsForDate(selectedDate).length === 0 && (
              <p className="no-appointments">No appointments scheduled</p>
            )}
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Appointment</h2>
              <button className="btn-icon" onClick={() => setShowNewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment}>
              <div className="modal-body">
                <div className="form-field">
                  <label>Title *</label>
                  <input type="text" name="title" placeholder="Appointment title" className="form-input" required />
                </div>
                <div className="form-field">
                  <label>Client *</label>
                  <input type="text" name="client" placeholder="Client name" className="form-input" required />
                </div>
                <div className="form-field">
                  <label>Technician *</label>
                  <select name="tech" className="form-select" required>
                    <option value="Nicolas Taveras">Nicolas Taveras</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Date *</label>
                    <input type="date" name="date" className="form-input" required />
                  </div>
                  <div className="form-field">
                    <label>Time *</label>
                    <input type="time" name="time" className="form-input" required />
                  </div>
                </div>
                <div className="form-field">
                  <label>Type *</label>
                  <select name="type" className="form-select" required>
                    <option value="onsite">On-site</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Description</label>
                  <textarea name="description" className="form-input" rows="3" placeholder="Additional details..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAppointment.title}</h2>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="appointment-detail-grid">
                <div className="detail-item">
                  <Clock size={18} />
                  <div>
                    <div className="detail-label">Time</div>
                    <div className="detail-value">{selectedAppointment.time}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <CalendarIcon size={18} />
                  <div>
                    <div className="detail-label">Date</div>
                    <div className="detail-value">{new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Users size={18} />
                  <div>
                    <div className="detail-label">Client</div>
                    <div className="detail-value">{selectedAppointment.client}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Users size={18} />
                  <div>
                    <div className="detail-label">Technician</div>
                    <div className="detail-value">{selectedAppointment.tech}</div>
                  </div>
                </div>
                <div className="detail-item">
                  {selectedAppointment.type === 'remote' ? <Video size={18} /> : <MapPin size={18} />}
                  <div>
                    <div className="detail-label">Type</div>
                    <div className="detail-value">{selectedAppointment.type === 'onsite' ? 'On-site' : 'Remote'}</div>
                  </div>
                </div>
              </div>
              {selectedAppointment.description && (
                <div style={{ marginTop: '20px' }}>
                  <div className="detail-label" style={{ marginBottom: '8px' }}>Description</div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>{selectedAppointment.description}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>Close</button>
              <button className="btn btn-primary" onClick={() => alert('Edit functionality coming soon!')}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentScheduler
