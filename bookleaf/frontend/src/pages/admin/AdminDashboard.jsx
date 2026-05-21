import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import { useSSE } from '../../hooks/useSSE'
import { statusColor, priorityColor, timeAgo } from '../../utils/helpers'
import { Ticket, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = () =>
    api.get('/admin/dashboard').then(res => setData(res.data)).finally(() => setLoading(false))

  useEffect(() => { fetchData() }, [])

  useSSE((event) => {
    if (event.type === 'new_ticket') {
      toast.success(`New ticket from ${event.ticket?.authorName || 'an author'}`)
      fetchData()
    }
    if (event.type === 'ticket_reply') {
      toast(`Reply on ticket ${event.ticketNumber}`, { icon: '💬' })
      fetchData()
    }
  })

  if (loading) return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-700 border-t-brand-500 rounded-full animate-spin" /></div></AdminLayout>

  const { stats, categoryBreakdown, recentTickets } = data || {}

  const statCards = [
    { label: 'Total Tickets', value: stats?.total || 0, icon: Ticket, color: 'text-blue-400 bg-blue-900/30' },
    { label: 'Open', value: stats?.open || 0, icon: Clock, color: 'text-yellow-400 bg-yellow-900/30' },
    { label: 'In Progress', value: stats?.inProgress || 0, icon: TrendingUp, color: 'text-brand-400 bg-brand-900/30' },
    { label: 'Critical', value: stats?.critical || 0, icon: AlertTriangle, color: 'text-red-400 bg-red-900/30', alert: stats?.critical > 0 },
  ]

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of all support activity</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, alert }) => (
            <div key={label} className={`card p-4 ${alert && value > 0 ? 'ring-2 ring-red-300' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className={`text-2xl font-bold ${alert && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Category breakdown */}
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4">By Category</h2>
            <div className="space-y-3">
              {categoryBreakdown?.sort((a, b) => b.count - a.count).map(({ _id, count }) => (
                <div key={_id} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 truncate pr-2">{_id}</span>
                  <span className="text-xs font-semibold text-gray-900 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                </div>
              ))}
              {!categoryBreakdown?.length && <p className="text-xs text-gray-400">No data yet</p>}
            </div>
          </div>

          {/* Recent tickets */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
              <Link to="/admin/tickets" className="text-sm text-brand-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentTickets?.map(ticket => (
                <Link key={ticket._id} to={`/admin/tickets/${ticket._id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                      <span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-xs text-gray-500">{ticket.authorName} · {timeAgo(ticket.createdAt)}</p>
                  </div>
                  <span className={`badge shrink-0 ${statusColor(ticket.status)}`}>{ticket.status}</span>
                </Link>
              ))}
              {!recentTickets?.length && (
                <div className="px-5 py-10 text-center text-sm text-gray-400">No tickets yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
