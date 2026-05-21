import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthorLayout from '../../components/author/AuthorLayout'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { formatCurrency } from '../../utils/helpers'
import { BookMarked, IndianRupee, Ticket, PlusCircle, TrendingUp, Clock } from 'lucide-react'

export default function AuthorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/author/profile'),
      api.get('/tickets?limit=5')
    ]).then(([profileRes, ticketsRes]) => {
      setProfile(profileRes.data.author)
      setTickets(ticketsRes.data.tickets)
    }).finally(() => setLoading(false))
  }, [])

  const totalEarned = profile?.books.reduce((s, b) => s + (b.total_royalty_earned || 0), 0) || 0
  const totalPending = profile?.books.reduce((s, b) => s + (b.royalty_pending || 0), 0) || 0
  const totalSold = profile?.books.reduce((s, b) => s + (b.total_copies_sold || 0), 0) || 0
  const publishedBooks = profile?.books.filter(b => b.status === 'Published & Live').length || 0

  if (loading) return <AuthorLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div></AuthorLayout>

  return (
    <AuthorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning, {user?.name.split(' ')[0]} 👋</h1>
            <p className="text-gray-500 text-sm mt-0.5">Here's an overview of your publishing account</p>
          </div>
          <Link to="/tickets/new" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Published Books', value: publishedBooks, icon: BookMarked, color: 'text-blue-600 bg-blue-50' },
            { label: 'Copies Sold', value: totalSold.toLocaleString(), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Total Earned', value: formatCurrency(totalEarned), icon: IndianRupee, color: 'text-brand-600 bg-brand-50' },
            { label: 'Royalty Pending', value: formatCurrency(totalPending), icon: Clock, color: totalPending > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-600 bg-gray-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Books preview */}
        {profile?.books && profile.books.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">My Books</h2>
              <Link to="/books" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {profile.books.slice(0, 3).map(book => (
                <div key={book.book_id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                    <p className="text-xs text-gray-500">{book.genre}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`badge ${book.status === 'Published & Live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {book.status === 'Published & Live' ? 'Live' : 'In Production'}
                    </span>
                    {book.royalty_pending > 0 && (
                      <span className="text-xs text-orange-600 font-medium">{formatCurrency(book.royalty_pending)} pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent tickets */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
            <Link to="/tickets" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {tickets.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No tickets yet</p>
              <Link to="/tickets/new" className="text-sm text-brand-600 hover:underline mt-1 inline-block">Submit your first ticket</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map(ticket => (
                <Link key={ticket._id} to={`/tickets/${ticket._id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.ticketNumber} · {ticket.category}</p>
                  </div>
                  <span className={`badge ml-3 shrink-0 ${
                    ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                    ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{ticket.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthorLayout>
  )
}
