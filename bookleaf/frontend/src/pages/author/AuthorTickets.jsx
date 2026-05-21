import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AuthorLayout from '../../components/author/AuthorLayout'
import api from '../../services/api'
import { useSSE } from '../../hooks/useSSE'
import { statusColor, priorityColor, timeAgo } from '../../utils/helpers'
import { PlusCircle, Ticket, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']

export default function AuthorTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const fetchTickets = useCallback(() => {
    const params = statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : ''
    api.get(`/tickets${params}`).then(res => setTickets(res.data.tickets)).finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useSSE((event) => {
    if (event.type === 'ticket_updated' || event.type === 'ticket_status_changed') {
      toast.success('Ticket updated — refreshing...')
      fetchTickets()
    }
  })

  return (
    <AuthorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-500 text-sm mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/tickets/new" className="btn-primary">
            <PlusCircle className="w-4 h-4" /> New Ticket
          </Link>
        </div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                ${statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'}`}>
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="card px-8 py-16 text-center">
            <Ticket className="w-9 h-9 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No tickets found</p>
            <p className="text-gray-400 text-sm mt-1">
              {statusFilter !== 'All' ? `No ${statusFilter.toLowerCase()} tickets` : 'Submit a ticket to get started'}
            </p>
            {statusFilter === 'All' && (
              <Link to="/tickets/new" className="btn-primary mt-4 inline-flex">
                <PlusCircle className="w-4 h-4" /> Submit your first ticket
              </Link>
            )}
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {tickets.map(ticket => (
              <Link key={ticket._id} to={`/tickets/${ticket._id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                    <span className={`badge ${statusColor(ticket.status)}`}>{ticket.status}</span>
                    <span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ticket.category} · {ticket.bookTitle} · {timeAgo(ticket.createdAt)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AuthorLayout>
  )
}
