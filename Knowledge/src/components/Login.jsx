import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useForm } from '../../../shared/src/index.js'
import './Login.css'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { values, errors, setValue, validate } = useForm(
    { username: '', password: '' },
    {
      username: { required: true },
      password: { required: true, minLength: 6 }
    }
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setError('')
    setLoading(true)

    try {
      const result = await login(values.username, values.password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Knowledge Base</h1>
          <p>Access your IT documentation and articles</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={values.username}
              onChange={(e) => setValue('username', e.target.value)}
              disabled={loading}
              required
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              disabled={loading}
              required
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-help">
          <p>Use demo credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
