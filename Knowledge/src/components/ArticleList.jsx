import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { knowledgeAPI } from '../services/api'
import './ArticleList.css'

function ArticleList({ searchTerm, selectedCategory }) {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState(new Set())

  useEffect(() => {
    // Only fetch articles if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      fetchArticles()
    }
  }, [searchTerm, selectedCategory])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCategory !== 'all') params.category_id = selectedCategory
      if (searchTerm) params.search = searchTerm

      const response = await knowledgeAPI.getArticles(params)
      // Handle both nested and direct response formats
      const articleData = response.data.articles || response.data
      setArticles(articleData)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavorite = async (id) => {
    try {
      await knowledgeAPI.favoriteArticle(id)
      setFavorites(prev => {
        const newFav = new Set(prev)
        if (newFav.has(id)) {
          newFav.delete(id)
        } else {
          newFav.add(id)
        }
        return newFav
      })
    } catch (error) {
      console.error('Failed to favorite article:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading articles...</div>
  }

  return (
    <div className="article-list-container">
      <div className="article-list">
        <div className="list-header">
          <h2>Articles ({articles.length})</h2>
          <button className="create-btn" onClick={() => navigate('/new')}>+ New Article</button>
        </div>

        {articles.length === 0 ? (
          <div className="no-articles">
            <p>No articles found</p>
          </div>
        ) : (
          <div className="articles-grid">
            {articles.map(article => (
              <div key={article.id} className="article-card">
                <div className="article-header">
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="category-badge">{article.category}</span>
                    {article.article_type && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: article.article_type === 'workflow' ? '#4CAF50' : 
                                   article.article_type === 'snippet' ? '#2196F3' : '#9C27B0',
                        color: 'white'
                      }}>
                        {article.article_type.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button 
                    className={`favorite-btn ${article.is_favorite || favorites.has(article.id) ? 'favorited' : ''}`}
                    onClick={() => handleFavorite(article.id)}
                  >
                    ⭐
                  </button>
                </div>
                
                <Link to={`/article/${article.id}`} className="article-link">
                  <h3>{article.title}</h3>
                  <p className="article-description">{article.summary || 'No description available'}</p>
                </Link>

                <div className="article-tags">
                  {article.tags && typeof article.tags === 'string' ? 
                    article.tags.split(',').map(tag => (
                      <span key={tag.trim()} className="tag">#{tag.trim()}</span>
                    )) : 
                    Array.isArray(article.tags) ?
                      article.tags.map(tag => (
                        <span key={tag} className="tag">#{tag}</span>
                      )) : null
                  }
                </div>

                <div className="article-footer">
                  <span className="author">By {article.author || 'Admin'}</span>
                  <span className="views">👁 {article.views || 0} views</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="sidebar">
        <div className="sidebar-card">
          <h3>Quick Stats</h3>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{articles.length}</span>
              <span className="stat-label">Total Articles</span>
            </div>
            <div className="stat">
              <span className="stat-value">{articles.filter(a => a.is_favorite).length}</span>
              <span className="stat-label">Favorites</span>
            </div>
          </div>
        </div>

        <div className="sidebar-card">
          <h3>Popular Tags</h3>
          <div className="popular-tags">
            <span className="tag">incident</span>
            <span className="tag">security</span>
            <span className="tag">network</span>
            <span className="tag">troubleshooting</span>
            <span className="tag">best-practices</span>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default ArticleList
