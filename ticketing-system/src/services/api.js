import { createAPIInstance } from '../../../shared/src/index.js'

// Create API instance for Ticketing System
const api = createAPIInstance()

export const ticketAPI = {
  getTickets: (params) => api.get('/tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  createTicket: (data) => api.post('/tickets', data),
  updateTicket: (id, data) => api.put(`/tickets/${id}`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, typeof data === 'string' ? { comment: data, is_internal: false } : data),
  assignTicket: (id, userId) => api.post(`/tickets/${id}/assign`, { user_id: userId }),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
  getTimeLog: (id) => api.get(`/tickets/${id}/time`),
  addTimeLog: (id, data) => api.post(`/tickets/${id}/time`, data),
  getTemplates: () => api.get('/tickets/templates'),
  applyTemplate: (templateId) => api.get(`/tickets/templates/${templateId}`),
}

export default api
