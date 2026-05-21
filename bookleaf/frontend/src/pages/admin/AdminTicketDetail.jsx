import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import { useSSE } from '../../hooks/useSSE'
import { statusColor, priorityColor, formatDate, timeAgo } from '../../utils/helpers'
import {
  ArrowLeft, Send, Sparkles, RefreshCw, ChevronDown, Lock, BookOpen,
  User, Shield, Eye, EyeOff, CheckCircle, Edit2, Save, X,
  Paperclip, FileText, Image, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
        <Paperclip className="w-3 h-3" /> {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
      </p>
      <div className="flex flex-wrap gap-2">
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
    </div>
  )
}

const CATEGORIES = ['Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry']
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']

export default function AdminTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [editingCategory, setEditingCategory] = useState(false)
  const [editingPriority, setEditingPriority] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const bottomRef = useRef(null)

  const fetchTicket = () =>
    api.get(`/tickets/${id}`).then(res => setTicket(res.data.ticket)).finally(() => setLoading(false))

  useEffect(() => { fetchTicket() }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages?.length])

  useSSE((event) => {
    if (event.ticketId?.toString() === id || event.ticketId === id) {
      fetchTicket()
      if (event.type === 'ticket_reply') toast('Author replied', { icon: '💬' })
    }
  })

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/messages`, { content: reply, isInternal })
      setReply('')
      fetchTicket()
      toast.success(isInternal ? 'Internal note added' : 'Response sent to author')
    } catch {
      toast.error('Failed to send')
    } finally {
      setSending(false)
    }
  }

  const useDraft = () => {
    if (ticket?.aiDraftResponse) {
      setReply(ticket.aiDraftResponse)
      setIsInternal(false)
      toast.success('Draft loaded — review and edit before sending')
    }
  }

  const regenerateDraft = async () => {
    setGeneratingDraft(true)
    try {
      const res = await api.post(`/ai/generate-draft/${id}`)
      setTicket(t => ({ ...t, aiDraftResponse: res.data.draft }))
      toast.success('New draft generated')
    } catch {
      toast.error('Failed to generate draft')
    } finally {
      setGeneratingDraft(false)
    }
  }

  const updateCategory = async (category) => {
    await api.patch(`/tickets/${id}`, { category, categoryOverridden: true })
    setTicket(t => ({ ...t, category, categoryOverridden: true }))
    setEditingCategory(false)
    toast.success('Category updated')
  }

  const updatePriority = async (priority) => {
    await api.patch(`/tickets/${id}`, { priority, priorityOverridden: true })
    setTicket(t => ({ ...t, priority, priorityOverridden: true }))
    setEditingPriority(false)
    toast.success('Priority updated')
  }

  const updateStatus = async (status) => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/tickets/${id}`, { status })
      setTicket(t => ({ ...t, status }))
      toast.success(`Ticket marked as ${status}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const assignToMe = async () => {
    const user = JSON.parse(localStorage.getItem('bl_user'))
    await api.patch(`/tickets/${id}`, { assignedTo: user.id, assignedToName: user.name })
    setTicket(t => ({ ...t, assignedToName: user.name }))
    toast.success('Ticket assigned to you')
  }

  if (loading) return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" /></div></AdminLayout>
  if (!ticket) return <AdminLayout><div className="text-center py-20 text-gray-500">Ticket not found</div></AdminLayout>

  const visibleMessages = ticket.messages || []

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <Link to="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </Link>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* LEFT: Conversation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                  <h1 className="text-lg font-semibold text-gray-900 mt-0.5">{ticket.subject}</h1>
                </div>
                <span className={`badge shrink-0 ${statusColor(ticket.status)}`}>{ticket.status}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>From: <strong className="text-gray-700">{ticket.authorName}</strong> ({ticket.authorEmail})</span>
                {ticket.bookTitle !== 'General / Account Level' && (
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{ticket.bookTitle}</span>
                )}
                <span>Opened {formatDate(ticket.createdAt)}</span>
                {ticket.assignedToName && <span>Assigned to: <strong className="text-gray-700">{ticket.assignedToName}</strong></span>}
              </div>
              <AttachmentList attachments={ticket.attachments} />
            </div>

            {/* Messages */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 text-sm font-medium text-gray-700 flex items-center justify-between">
                <span>Conversation ({visibleMessages.length})</span>
                <span className="text-xs text-gray-400">Internal notes visible only to admins</span>
              </div>
              <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
                {visibleMessages.map((msg, i) => {
                  const isAdmin = msg.sender === 'admin'
                  const isNote = msg.isInternal
                  return (
                    <div key={i} className={`flex gap-3 ${isAdmin && !isNote ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                        ${isNote ? 'bg-amber-100' : isAdmin ? 'bg-brand-100' : 'bg-blue-100'}`}>
                        {isNote ? <Lock className="w-3.5 h-3.5 text-amber-600" /> :
                          isAdmin ? <Shield className="w-3.5 h-3.5 text-brand-600" /> :
                          <User className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className={`max-w-[80%] ${isAdmin && !isNote ? 'items-end' : ''} flex flex-col`}>
                        <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500 ${isAdmin && !isNote ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium">
                            {isNote ? `${msg.senderName} (internal note)` : isAdmin ? 'BookLeaf Support' : ticket.authorName}
                          </span>
                          <span>{timeAgo(msg.createdAt)}</span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                          ${isNote ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none' :
                            isAdmin ? 'bg-brand-50 text-gray-800 rounded-tr-none' :
                            'bg-blue-50 text-gray-800 rounded-tl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-gray-100 p-4 space-y-3">
                {/* Toggle internal/public */}
                <div className="flex gap-2">
                  <button onClick={() => setIsInternal(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${!isInternal ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    <Eye className="w-3 h-3" /> Public Reply
                  </button>
                  <button onClick={() => setIsInternal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${isInternal ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    <Lock className="w-3 h-3" /> Internal Note
                  </button>
                </div>

                <form onSubmit={handleReply} className="flex gap-3">
                  <textarea
                    className={`input flex-1 resize-none min-h-[100px] text-sm ${isInternal ? 'border-amber-300 focus:ring-amber-400' : ''}`}
                    placeholder={isInternal ? 'Add an internal note (not visible to author)…' : 'Type your response to the author…'}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                  />
                  <button type="submit" className={`self-end ${isInternal ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={sending || !reply.trim()}>
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending…' : isInternal ? 'Add Note' : 'Send'}
                  </button>
                </form>
              </div>
            </div>

            {/* AI Draft */}
            <div className={`card overflow-hidden border ${ticket.aiDraftResponse ? 'border-purple-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between px-5 py-3.5 bg-purple-50 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">AI-Drafted Response</span>
                  {ticket.aiDraftGeneratedAt && (
                    <span className="text-xs text-purple-500">· {timeAgo(ticket.aiDraftGeneratedAt)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={regenerateDraft} disabled={generatingDraft}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800">
                    <RefreshCw className={`w-3 h-3 ${generatingDraft ? 'animate-spin' : ''}`} />
                    {generatingDraft ? 'Generating…' : 'Regenerate'}
                  </button>
                  {ticket.aiDraftResponse && (
                    <button onClick={useDraft}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700">
                      <Edit2 className="w-3 h-3" /> Use this draft
                    </button>
                  )}
                </div>
              </div>
              <div className="p-5">
                {ticket.aiDraftResponse ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.aiDraftResponse}</p>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 mb-3">No AI draft yet</p>
                    <button onClick={regenerateDraft} disabled={generatingDraft} className="btn-secondary text-xs">
                      <Sparkles className="w-3 h-3" /> {generatingDraft ? 'Generating…' : 'Generate Draft'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            {/* Status management */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Ticket Management</h3>

              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Status</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => updateStatus(s)} disabled={updatingStatus}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors
                        ${ticket.status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Assignment</label>
                {ticket.assignedToName ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-green-800">{ticket.assignedToName}</span>
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                ) : (
                  <button onClick={assignToMe} className="btn-secondary w-full justify-center text-xs">
                    Assign to me
                  </button>
                )}
              </div>
            </div>

            {/* Classification */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900 text-sm">AI Classification</h3>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-500">Category</label>
                  {ticket.categoryOverridden && <span className="text-xs text-orange-500">overridden</span>}
                </div>
                {editingCategory ? (
                  <div className="space-y-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => updateCategory(c)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors
                          ${ticket.category === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
                        {c}
                      </button>
                    ))}
                    <button onClick={() => setEditingCategory(false)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-gray-800">{ticket.category}</span>
                    <button onClick={() => setEditingCategory(true)} className="text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-500">Priority</label>
                  {ticket.priorityOverridden && <span className="text-xs text-orange-500">overridden</span>}
                </div>
                {editingPriority ? (
                  <div className="space-y-1.5">
                    {PRIORITIES.map(p => (
                      <button key={p} onClick={() => updatePriority(p)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors
                          ${ticket.priority === p ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setEditingPriority(false)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className={`badge ${priorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    <button onClick={() => setEditingPriority(true)} className="text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Score */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Priority Score</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${
                      ticket.priorityScore >= 80 ? 'bg-red-500' :
                      ticket.priorityScore >= 60 ? 'bg-orange-500' :
                      ticket.priorityScore >= 35 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} style={{ width: `${ticket.priorityScore || 0}%` }} />
                  </div>
                  <span className="text-xs font-mono text-gray-600">{ticket.priorityScore}/100</span>
                </div>
              </div>
            </div>

            {/* Ticket meta */}
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm">Details</h3>
              {[
                { label: 'Created', value: formatDate(ticket.createdAt) },
                { label: 'Last updated', value: formatDate(ticket.updatedAt) },
                ticket.resolvedAt && { label: 'Resolved', value: formatDate(ticket.resolvedAt) },
                { label: 'Author', value: ticket.authorName },
                { label: 'Email', value: ticket.authorEmail },
                ticket.bookTitle !== 'General / Account Level' && { label: 'Book', value: ticket.bookTitle },
                { label: 'Print partner', value: ticket.printPartner || '—' },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-medium text-gray-800 text-right max-w-[140px] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
