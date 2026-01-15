import { useState, useEffect } from 'react'
import { useAPI, mockDataManager } from '../../shared/src/index.js'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import { monitoringAPI } from './services/api'
import './App.css'

function App() {
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Use shared hook for service data with mock fallback
  const { data: services, loading, refetch } = useAPI(
    monitoringAPI.getServices,
    [lastRefresh],
    {
      fallbackData: mockDataManager.generateMockServices(),
      requireAuth: false
    }
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date())
      refetch()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval, refetch])

  return (
    <div className="app">
      <Header 
        lastRefresh={lastRefresh}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
      />
      <Dashboard 
        lastRefresh={lastRefresh}
        services={services}
        loading={loading}
      />
    </div>
  )
}

export default App
