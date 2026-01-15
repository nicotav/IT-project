// Shared library exports
export { AuthProvider, useAuth } from './hooks/useAuth.js'
export { useAPI, useSearch, usePagination, useForm } from './hooks/common.js'
export { createAPIInstance, createCommonAPI, api, commonAPI } from './services/api.js'
export { MockDataManager, mockDataManager } from './utils/mockData.js'