import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EquipmentList from './pages/Equipment/EquipmentList'
import EquipmentDetail from './pages/Equipment/EquipmentDetail'
import TicketList from './pages/Tickets/TicketList'
import TicketDetail from './pages/Tickets/TicketDetail'
import Locations from './pages/Locations'
import Users from './pages/Users'
import ActivityLog from './pages/ActivityLog'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="equipment" element={<EquipmentList />} />
              <Route path="equipment/:id" element={<EquipmentDetail />} />
              <Route path="tickets" element={<TicketList />} />
              <Route path="tickets/:id" element={<TicketDetail />} />
              <Route path="locations" element={<Locations />} />

              {/* Admin-only */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="users" element={<Users />} />
                <Route path="activity" element={<ActivityLog />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
