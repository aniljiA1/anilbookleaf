import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import AuthorLayout from '../../components/author/AuthorLayout'
import api from '../../services/api'
import { useSSE } from '../../hooks/useSSE'
import { statusColor, priorityColor, formatDate, timeAgo } from '../../utils/helpers'
import { ArrowLeft, Send, BookOpen, User, Shield, Paperclip, FileText, Image, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {attachments.map((a, i) => {
        const isImage = a.mimetype?.startsWith('image/')
        const href = `${import.meta.env.VITE_API_BASE_URL || ""}${a.url}`
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-brand-400 hover:text-brand-600 transition-colors">
            {isImage
              ? <Image className="w-3.5 h-3.5 text-blue-500" />
              : <FileText className="w-3.5 h-3.5 text-red-500" />}
            <span className="max-w-[140px] truncate">{a.originalName}</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        )
      })}
    </div>
  )
}

export default function AuthorTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const fetchTicket = () =>
    api.get(`/tickets/${id}`).then(res => setTicket(res.data.ticket)).finally(() => setLoading(false))

  useEffect(() => { fetchTicket() }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages?.length])

  useSSE((event) => {
    if (event.ticketId === id || event.ticketId?.toString() === id) {
      fetchTicket()
      if (event.type === 'ticket_updated') toast.success('New response from the support team!')
      if (event.type === 'ticket_status_changed') toast(`Ticket status changed to ${event.status}`, { icon: 'ℹ️' })
    }
  })

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/messages`, { content: reply })
      setReply('')
      fetchTicket()
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <AuthorLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div></AuthorLayout>
  if (!ticket) return <AuthorLayout><div className="text-center py-20 text-gray-500">Ticket not found</div></AuthorLayout>

  const publicMessages = ticket.messages?.filter(m => !m.isInternal) || []

  return (
    <AuthorLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Back */}
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </Link>

        {/* Ticket header */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
              <h1 className="text-lg font-semibold text-gray-900 mt-0.5">{ticket.subject}</h1>
            </div>
            <span className={`badge shrink-0 ${statusColor(ticket.status)}`}>{ticket.status}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
            <span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
            <span>{ticket.category}</span>
            {ticket.bookTitle !== 'General / Account Level' && (
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{ticket.bookTitle}</span>
            )}
            <span>Opened {formatDate(ticket.createdAt)}</span>
          </div>
          <AttachmentList attachments={ticket.attachments} />
        </div>

        {/* Messages thread */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-medium text-gray-700">
            Conversation ({publicMessages.length})
          </div>
          <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
            {publicMessages.map((msg, i) => {
              const isAdmin = msg.sender === 'admin'
              return (
                <div key={i} className={`flex gap-3 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${isAdmin ? 'bg-brand-100' : 'bg-blue-100'}`}>
                    {isAdmin ? <Shield className="w-4 h-4 text-brand-600" /> : <User className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className={`max-w-[80%] ${isAdmin ? '' : 'items-end'} flex flex-col`}>
                    <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                      <span className="font-medium">{isAdmin ? 'BookLeaf Support' : 'You'}</span>
                      <span>{timeAgo(msg.createdAt)}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${isAdmin
                        ? 'bg-brand-50 text-gray-800 rounded-tl-none'
                        : 'bg-blue-600 text-white rounded-tr-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          {ticket.status !== 'Closed' && (
            <div className="border-t border-gray-100 p-4">
              <form onSubmit={handleReply} className="flex gap-3">
                <textarea
                  className="input flex-1 resize-none min-h-[80px] text-sm"
                  placeholder="Type your reply…"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleReply(e) }}
                />
                <button type="submit" className="btn-primary self-end" disabled={sending || !reply.trim()}>
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-2">⌘+Enter to send</p>
            </div>
          )}
          {ticket.status === 'Closed' && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
              This ticket is closed. Open a new ticket if you need further assistance.
            </div>
          )}
        </div>
      </div>
    </AuthorLayout>
  )
}
