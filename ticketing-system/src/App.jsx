import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TicketList from './components/TicketList'
import TicketView from './components/TicketView'
import CreateTicket from './components/CreateTicket'
import KanbanBoard from './components/KanbanBoard'
import AppointmentScheduler from './components/AppointmentScheduler'
import TeamsManagement from './components/TeamsManagement'
import Clients from './components/Clients'
import Analytics from './components/Analytics'
import CustomerPortal from './components/CustomerPortal'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-layout">
          <Header />
          <main className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketList />} />
              <Route path="/ticket/:id" element={<TicketView />} />
              <Route path="/create" element={<CreateTicket />} />
              <Route path="/boards" element={<KanbanBoard />} />
              <Route path="/appointments" element={<AppointmentScheduler />} />
              <Route path="/teams" element={<TeamsManagement />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/portal" element={<CustomerPortal />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
