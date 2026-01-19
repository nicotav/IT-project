import { createAPIInstance, commonAPI } from '../../../shared/src/index.js'

// Create API instance for Access Center
export const api = createAPIInstance()

// Export shared APIs
export const authAPI = commonAPI.auth
export const statsAPI = commonAPI.dashboard
