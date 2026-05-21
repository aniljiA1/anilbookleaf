import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import { useSSE } from '../../hooks/useSSE'
import { statusColor, priorityColor, priorityDot, timeAgo } from '../../utils/helpers'
import { Search, Filter, ChevronRight, Ticket } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['All', 'Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry']

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'All', priority: 'All', category: 'All', search: '' })
  const [page, setPage] = useState(1)

  const fetchTickets = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (filters.status !== 'All') params.set('status', filters.status)
    if (filters.priority !== 'All') params.set('priority', filters.priority)
    if (filters.category !== 'All') params.set('category', filters.category)
    if (filters.search) params.set('search', filters.search)
    api.get(`/admin/tickets?${params}`)
      .then(res => { setTickets(res.data.tickets); setTotal(res.data.total) })
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useSSE((event) => {
    if (['new_ticket', 'ticket_reply'].includes(event.type)) {
      if (event.type === 'new_ticket') toast.success(`New ticket: ${event.ticket?.subject?.slice(0, 40)}…`)
      fetchTickets()
    }
  })

  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1) }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tickets</h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} tickets total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by subject, author name, or ticket number…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Status</p>
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setFilter('status', s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${filters.status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Priority</p>
              <div className="flex gap-1.5 flex-wrap">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setFilter('priority', p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${filters.priority === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <select className="input text-xs" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tickets table */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="card px-8 py-16 text-center">
            <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tickets match these filters</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Ticket', 'Author', 'Subject', 'Category', 'Priority', 'Status', 'Age', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">{ticket.authorName}</td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-400 truncate">{ticket.bookTitle}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap max-w-[140px]">
                        <span className="truncate block">{ticket.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${priorityColor(ticket.priority)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1 ${priorityDot(ticket.priority)}`} />
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${statusColor(ticket.status)}`}>{ticket.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{timeAgo(ticket.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/tickets/${ticket._id}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium hover:underline whitespace-nowrap">
                          Open <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-2">
            <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / 20)}</span>
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}>Next</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
