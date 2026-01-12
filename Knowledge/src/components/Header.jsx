import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import './Header.css'

function Header({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, onLogout }) {
  const [categories, setCategories] = useState([])
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Only fetch data if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      fetchCategories()
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await knowledgeAPI.getCategories()
      // Handle both array and object responses
      const categoryData = Array.isArray(response.data) ? response.data : response.data.categories || []
      setCategories(categoryData)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([]) // Set empty array on error
    }
  }

  return (
    <header className="kb-header">
      <div className="header-container">
        <div className="header-top">
          <Link to="/" className="logo">
            <span className="logo-icon">📚</span>
            <h1>IT Knowledge Base</h1>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user && (
              <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                👤 {user.username}
              </span>
            )}
            <button 
              onClick={onLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Logout
            </button>
            <a href="http://localhost:3000" className="back-link">← Back to Access Center</a>
          </div>
        </div>

        <div className="header-search">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="header-filters">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}

export default Header
