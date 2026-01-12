import { createAPIInstance } from '../../../shared/src/index.js'

// Create API instance for Knowledge Base
const api = createAPIInstance()

export const knowledgeAPI = {
  // Articles
  getArticles: (params) => api.get('/knowledge/articles', { params }),
  getArticle: (id) => api.get(`/knowledge/articles/${id}`),
  createArticle: (data) => api.post('/knowledge/articles', data),
  updateArticle: (id, data) => api.put(`/knowledge/articles/${id}`, data),
  deleteArticle: (id) => api.delete(`/knowledge/articles/${id}`),
  
  // Search
  searchArticles: (query) => api.get('/knowledge/search', { params: { query } }),
  advancedSearch: (filters) => api.post('/knowledge/search', filters),
  
  // Categories
  getCategories: () => api.get('/knowledge/categories'),
  
  // Favorites
  favoriteArticle: (id) => api.post(`/knowledge/articles/${id}/favorite`),
  getFavorites: () => api.get('/knowledge/favorites'),
  
  // Versions
  getVersions: (id) => api.get(`/knowledge/articles/${id}/versions`),
  
  // Comments
  getComments: (articleId) => api.get(`/knowledge/articles/${articleId}/comments`),
  addComment: (articleId, data) => api.post(`/knowledge/articles/${articleId}/comments`, data),
  deleteComment: (articleId, commentId) => api.delete(`/knowledge/articles/${articleId}/comments/${commentId}`),
  
  // Co-authors
  getCoAuthors: (articleId) => api.get(`/knowledge/articles/${articleId}/coauthors`),
  addCoAuthor: (articleId, data) => api.post(`/knowledge/articles/${articleId}/coauthors`, data),
  removeCoAuthor: (articleId, coauthorId) => api.delete(`/knowledge/articles/${articleId}/coauthors/${coauthorId}`),
  
  // Workflow Steps
  getWorkflowSteps: (articleId) => api.get(`/knowledge/articles/${articleId}/workflow-steps`),
  saveWorkflowSteps: (articleId, steps) => api.post(`/knowledge/articles/${articleId}/workflow-steps`, steps),
  
  // Ticket Links
  getArticleTickets: (articleId) => api.get(`/knowledge/articles/${articleId}/tickets`),
  linkTicket: (articleId, data) => api.post(`/knowledge/articles/${articleId}/link-ticket`, data),
  unlinkTicket: (articleId, linkId) => api.delete(`/knowledge/articles/${articleId}/tickets/${linkId}`),
  
  // Related Articles
  getRelatedArticles: (articleId, limit = 5) => api.get(`/knowledge/articles/${articleId}/related`, { params: { limit } }),
}

export default api
