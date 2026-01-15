/**
 * Centralized mock data management - eliminates duplicate mock data patterns
 */

export class MockDataManager {
  constructor() {
    this.authToken = null
  }

  /**
   * Check if we should use mock data (no authentication)
   */
  shouldUseMockData() {
    return !localStorage.getItem('token')
  }

  /**
   * Generic API call wrapper with mock data fallback
   */
  async apiCallWithFallback(apiCall, mockData, options = {}) {
    if (this.shouldUseMockData()) {
      // Simulate API delay for realistic UX
      if (options.delay !== false) {
        await new Promise(resolve => setTimeout(resolve, options.delay || 300))
      }
      return { data: mockData }
    }

    try {
      return await apiCall()
    } catch (error) {
      console.warn('API call failed, falling back to mock data:', error.message)
      return { data: mockData }
    }
  }

  /**
   * Common mock data generators
   */
  static generateMockTickets(count = 10) {
    const statuses = ['open', 'in_progress', 'resolved', 'closed']
    const priorities = ['low', 'medium', 'high', 'urgent']
    const categories = ['Hardware', 'Software', 'Network', 'Email', 'Security']
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Sample Ticket ${i + 1}`,
      description: `This is a sample ticket description for ticket ${i + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      assignee: `Tech ${Math.floor(Math.random() * 5) + 1}`,
      requester: `User ${Math.floor(Math.random() * 20) + 1}`,
      company: `Company ${Math.floor(Math.random() * 10) + 1}`,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  }

  static generateMockArticles(count = 15) {
    const categories = ['Windows', 'Network', 'Office 365', 'Security', 'Hardware']
    const processes = ['Incident', 'Problem', 'Change', 'Service Request']
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Knowledge Article ${i + 1}`,
      content: `## Overview\n\nThis is sample content for knowledge article ${i + 1}.\n\n## Steps\n\n1. First step\n2. Second step\n3. Third step`,
      summary: `Summary for article ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      author: `Author ${Math.floor(Math.random() * 5) + 1}`,
      itil_process: processes[Math.floor(Math.random() * processes.length)],
      tags: ['sample', 'demo', 'test'].join(','),
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: Math.floor(Math.random() * 1000),
      is_favorite: Math.random() > 0.8,
    }))
  }

  static generateMockCompanies(count = 8) {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing']
    const statuses = ['active', 'inactive', 'pending']
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Company ${String.fromCharCode(65 + i)}`,
      contact: `Contact ${i + 1}`,
      email: `contact${i + 1}@company${String.fromCharCode(65 + i).toLowerCase()}.com`,
      phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      address: `${100 + i * 10} Business Ave, City, State ${10000 + i}`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assets: Math.floor(Math.random() * 50) + 5,
      tickets: Math.floor(Math.random() * 20),
      revenue: Math.floor(Math.random() * 100000) + 10000,
      lastContact: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }))
  }

  static generateMockTeams(count = 5) {
    const teamNames = ['Help Desk', 'Infrastructure', 'Security', 'Network', 'Development']
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `${teamNames[i] || `Team ${i + 1}`} Team`,
      description: `${teamNames[i] || `Team ${i + 1}`} management and support`,
      member_count: Math.floor(Math.random() * 10) + 3,
      active_tickets: Math.floor(Math.random() * 20),
      resolved_today: Math.floor(Math.random() * 10),
    }))
  }

  static generateMockServices(count = 12) {
    const serviceTypes = ['Web Server', 'Database', 'Email Server', 'File Server', 'DNS Server']
    const statuses = ['online', 'offline', 'warning', 'critical']
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `${serviceTypes[i % serviceTypes.length]} ${Math.floor(i / serviceTypes.length) + 1}`,
      type: serviceTypes[i % serviceTypes.length].toLowerCase().replace(' ', '-'),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      uptime: `${(Math.random() * 10 + 90).toFixed(1)}%`,
      responseTime: Math.floor(Math.random() * 200) + 50,
      lastCheck: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
    }))
  }

  /**
   * Dashboard stats mock data
   */
  static generateMockDashboardStats() {
    return {
      totalTickets: Math.floor(Math.random() * 100) + 50,
      openTickets: Math.floor(Math.random() * 30) + 10,
      resolvedToday: Math.floor(Math.random() * 15) + 5,
      avgResponseTime: `${Math.floor(Math.random() * 120) + 30} min`,
      totalArticles: Math.floor(Math.random() * 50) + 100,
      articlesThisWeek: Math.floor(Math.random() * 10) + 3,
      servicesOnline: Math.floor(Math.random() * 5) + 15,
      activeAlerts: Math.floor(Math.random() * 8) + 2,
      systemHealth: `${(Math.random() * 20 + 80).toFixed(1)}%`,
      
      // Recent activity
      recentActivity: Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: ['ticket', 'article', 'alert'][Math.floor(Math.random() * 3)],
        title: `Recent activity ${i + 1}`,
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        user: `User ${Math.floor(Math.random() * 10) + 1}`,
      }))
    }
  }
}

// Create singleton instance
export const mockDataManager = new MockDataManager()