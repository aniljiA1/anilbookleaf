import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Pages
import LoginPage from './pages/LoginPage'
import AuthorDashboard from './pages/author/AuthorDashboard'
import AuthorBooks from './pages/author/AuthorBooks'
import AuthorTickets from './pages/author/AuthorTickets'
import AuthorNewTicket from './pages/author/AuthorNewTicket'
import AuthorTicketDetail from './pages/author/AuthorTicketDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTickets from './pages/admin/AdminTickets'
import AdminTicketDetail from './pages/admin/AdminTicketDetail'
import AdminAuthors from './pages/admin/AdminAuthors'

// Route guards
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return children
}

function Spinner() {
  return (
    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Author routes */}
          <Route path="/dashboard" element={<ProtectedRoute role="author"><AuthorDashboard /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute role="author"><AuthorBooks /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute role="author"><AuthorTickets /></ProtectedRoute>} />
          <Route path="/tickets/new" element={<ProtectedRoute role="author"><AuthorNewTicket /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ProtectedRoute role="author"><AuthorTicketDetail /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/tickets" element={<ProtectedRoute role="admin"><AdminTickets /></ProtectedRoute>} />
          <Route path="/admin/tickets/:id" element={<ProtectedRoute role="admin"><AdminTicketDetail /></ProtectedRoute>} />
          <Route path="/admin/authors" element={<ProtectedRoute role="admin"><AdminAuthors /></ProtectedRoute>} />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
}
