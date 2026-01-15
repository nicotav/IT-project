import axios from 'axios'

/**
 * Base API configuration for all MSP applications
 */
export const API_CONFIG = {
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}

/**
 * Create an axios instance with automatic token handling
 */
export function createAPIInstance(config = {}) {
  const api = axios.create({
    ...API_CONFIG,
    ...config,
  })

  // Add token to requests dynamically via interceptor
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Handle authentication errors globally
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return api
}

/**
 * Common API endpoints used across applications
 */
export function createCommonAPI(api) {
  return {
    // Authentication
    auth: {
      login: (username, password) => {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)
        return api.post('/auth/login', formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      },
      register: (userData) => api.post('/auth/register', userData),
      getCurrentUser: () => api.get('/auth/me'),
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
      }
    },

    // Dashboard stats (used by Access Center)
    dashboard: {
      getStats: () => api.get('/dashboard/stats'),
      getRecentActivity: () => api.get('/dashboard/recent-activity'),
    },
  }
}

// Default API instance
export const api = createAPIInstance()
export const commonAPI = createCommonAPI(api)