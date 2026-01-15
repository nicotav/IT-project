import { createAPIInstance } from '../../../shared/src/index.js'

// Create API instance for Monitoring Dashboard
const api = createAPIInstance()

export const monitoringAPI = {
  getServices: () => api.get('/monitoring/services'),
  getService: (id) => api.get(`/monitoring/services/${id}`),
  getAlerts: (params) => api.get('/monitoring/alerts', { params }),
  acknowledgeAlert: (id) => api.post(`/monitoring/alerts/${id}/acknowledge`),
  getSLAStatus: () => api.get('/monitoring/sla'),
  getMetrics: (serviceId, timeRange) => api.get(`/monitoring/metrics/${serviceId}`, { params: { timeRange } }),
  getHealthStatus: () => api.get('/monitoring/health'),
  getTrending: () => api.get('/monitoring/trending'),
}

export default api
