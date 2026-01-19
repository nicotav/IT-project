import { useState } from 'react'
import { useAuth, useForm } from '../../../shared/src/index.js'
import './Login.css'

function Login() {
  const { login } = useAuth()
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
      if (!result.success) {
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
      <div className="login-card">
        <h1>IT Access Center</h1>
        <p className="subtitle">Login to access your systems</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={values.username}
              onChange={(e) => setValue('username', e.target.value)}
              required
              disabled={loading}
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={values.password}
              onChange={(e) => setValue('password', e.target.value)}
              required
              disabled={loading}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
