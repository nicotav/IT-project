import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { knowledgeAPI } from '../services/api'
import './ArticleView.css'

function ArticleView() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [versions, setVersions] = useState([])
  const [workflowSteps, setWorkflowSteps] = useState([])
  const [relatedArticles, setRelatedArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState({})

  useEffect(() => {
    fetchArticle()
    fetchVersions()
  }, [id])

  const fetchArticle = async () => {
    try {
      const response = await knowledgeAPI.getArticle(id)
      setArticle(response.data)
      
      // Fetch workflow steps if workflow article
      if (response.data.article_type === 'workflow') {
        fetchWorkflowSteps()
      }
      
      // Fetch related articles
      fetchRelatedArticles()
    } catch (error) {
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflowSteps = async () => {
    try {
      const response = await knowledgeAPI.getWorkflowSteps(id)
      setWorkflowSteps(response.data)
    } catch (error) {
      console.error('Failed to fetch workflow steps:', error)
    }
  }

  const fetchRelatedArticles = async () => {
    try {
      const response = await knowledgeAPI.getRelatedArticles(id)
      setRelatedArticles(response.data.slice(0, 5)) // Top 5
    } catch (error) {
      console.error('Failed to fetch related articles:', error)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await knowledgeAPI.getVersions(id)
      setVersions(response.data)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedCode({ ...copiedCode, [index]: true })
    setTimeout(() => {
      setCopiedCode({ ...copiedCode, [index]: false })
    }, 2000)
  }

  const CodeBlock = ({ language, value, index }) => {
    const isCopied = copiedCode[index]
    
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => handleCopyCode(value, index)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '8px',
            background: '#2d2d2d',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#fff',
            fontSize: '12px'
          }}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: '4px' }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Loading article...</div>
  }

  if (!article) {
    return <div className="loading">Article not found</div>
  }

  return (
    <div className="article-view-container">
      <div className="article-content">
        <div className="breadcrumb">
          <Link to="/">← Back to Articles</Link>
        </div>

        <article className="article">
          <header className="article-header-view">
            <div className="article-type-badge" style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              marginRight: '8px',
              background: article.article_type === 'workflow' ? '#4CAF50' : 
                         article.article_type === 'snippet' ? '#2196F3' : '#9C27B0',
              color: 'white'
            }}>
              {article.article_type?.toUpperCase() || 'REFERENCE'}
            </div>
            <div className="category-badge">{article.category || 'General'}</div>
            <h1>{article.title}</h1>
            
            {article.summary && (
              <p className="article-summary" style={{
                fontSize: '18px',
                color: '#666',
                marginTop: '12px',
                lineHeight: '1.6'
              }}>
                {article.summary}
              </p>
            )}
            
            <div className="article-meta">
              <span>By {article.author_name || 'Admin'}</span>
              <span>•</span>
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>👁 {article.views || 0} views</span>
              <span>•</span>
              <span>v{article.version || 1}</span>
            </div>
            <div className="article-tags-view">
              {article.tags?.split(',').map(tag => (
                <span key={tag.trim()} className="tag">#{tag.trim()}</span>
              ))}
            </div>
          </header>

          {/* Workflow Steps */}
          {article.article_type === 'workflow' && workflowSteps.length > 0 && (
            <div className="workflow-steps-display" style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h2>Workflow Steps</h2>
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="workflow-step-card" style={{
                  background: 'white',
                  padding: '16px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #4CAF50'
                }}>
                  <h3>Step {step.step_number}: {step.title}</h3>
                  <p>{step.description}</p>
                  
                  {step.code_snippet && (
                    <div style={{ marginTop: '12px' }}>
                      <CodeBlock 
                        language={step.code_language || 'bash'}
                        value={step.code_snippet}
                        index={`step-${index}`}
                      />
                    </div>
                  )}
                  
                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {step.success_outcome && (
                      <div style={{ padding: '8px', background: '#e8f5e9', borderRadius: '4px' }}>
                        <strong style={{ color: '#2e7d32' }}>✓ Success:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{step.success_outcome}</p>
                      </div>
                    )}
                    {step.failure_outcome && (
                      <div style={{ padding: '8px', background: '#ffebee', borderRadius: '4px' }}>
                        <strong style={{ color: '#c62828' }}>✗ If Failed:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{step.failure_outcome}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Article Content - Markdown Rendered */}
          <div className="article-body markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeString = String(children).replace(/\n$/, '')
                  
                  return !inline && match ? (
                    <CodeBlock 
                      language={match[1]}
                      value={codeString}
                      index={`content-${codeString.substring(0, 20)}`}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          <footer className="article-footer-view">
            <Link to={`/edit/${article.id}`} className="action-btn">Edit Article</Link>
            <button className="action-btn secondary">Export PDF</button>
            <button className="action-btn secondary">Share</button>
          </footer>
        </article>
      </div>

      <aside className="article-sidebar">
        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="sidebar-card">
            <h3>Related Articles</h3>
            <div className="related-articles">
              {relatedArticles.map(related => (
                <Link 
                  key={related.id} 
                  to={`/article/${related.id}`}
                  className="related-article-item"
                  style={{
                    display: 'block',
                    padding: '8px 0',
                    borderBottom: '1px solid #eee',
                    textDecoration: 'none',
                    color: '#333'
                  }}
                >
                  <strong>{related.title}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {related.category}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Version History */}
        {versions.length > 0 && (
          <div className="sidebar-card">
            <h3>Version History</h3>
            <div className="versions-list">
              {versions.slice(0, 5).map(v => (
                <div key={v.version} className="version-item">
                  <div className="version-header">
                    <strong>v{v.version}</strong>
                    <span className="version-date">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="version-changes">{v.change_description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default ArticleView
