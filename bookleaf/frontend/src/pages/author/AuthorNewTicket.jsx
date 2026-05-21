import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthorLayout from '../../components/author/AuthorLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Send, Paperclip, Info, X, FileText, Image, File } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
const ALLOWED_EXT  = ['.png', '.jpg', '.jpeg', '.pdf']

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />
  if (type === 'application/pdf')  return <FileText className="w-4 h-4 text-red-500" />
  return <File className="w-4 h-4 text-gray-500" />
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AuthorNewTicket() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const [books, setBooks]       = useState([])
  const [form, setForm]         = useState({ bookId: '', bookTitle: 'General / Account Level', subject: '', description: '' })
  const [files, setFiles]       = useState([])   // { file, preview, id }
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/author/books').then(res => setBooks(res.data.books))
  }, [])

  // ── file validation & adding ──────────────────────────────────────────────
  const addFiles = useCallback((incoming) => {
    const next = []
    for (const file of Array.from(incoming)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only PNG, JPG, PDF allowed`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 10 MB limit`)
        continue
      }
      if (files.length + next.length >= 5) {
        toast.error('Maximum 5 attachments per ticket')
        break
      }
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null
      next.push({ file, preview, id: `${file.name}-${Date.now()}-${Math.random()}` })
    }
    if (next.length) setFiles(f => [...f, ...next])
  }, [files])

  const removeFile = (id) => {
    setFiles(f => {
      const removed = f.find(x => x.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return f.filter(x => x.id !== id)
    })
  }

  // ── drag & drop ───────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false) }
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  // ── book selector ─────────────────────────────────────────────────────────
  const handleBookChange = (e) => {
    const val = e.target.value
    if (!val) {
      setForm(f => ({ ...f, bookId: '', bookTitle: 'General / Account Level' }))
    } else {
      const book = books.find(b => b.book_id === val)
      setForm(f => ({ ...f, bookId: val, bookTitle: book?.title || '' }))
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.description.trim().length < 10) {
      return toast.error('Description must be at least 10 characters')
    }
    setSubmitting(true)
    try {
      // Build FormData so files travel with the request
      const fd = new FormData()
      fd.append('bookId',       form.bookId)
      fd.append('bookTitle',    form.bookTitle)
      fd.append('subject',      form.subject)
      fd.append('description',  form.description)
      files.forEach(({ file }) => fd.append('attachments', file))

      const res = await api.post('/tickets', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success("Ticket submitted! We'll get back to you soon.")
      navigate(`/tickets/${res.data.ticket._id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthorLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Submit a Support Ticket</h1>
          <p className="text-gray-500 text-sm mt-0.5">Our team typically responds within 24–48 hours</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Book selector */}
            <div>
              <label className="label">Which book is this about?</label>
              <select className="input" value={form.bookId} onChange={handleBookChange}>
                <option value="">General / Account Level</option>
                {books.map(book => (
                  <option key={book.book_id} value={book.book_id}>{book.title}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="label">Subject <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input"
                placeholder="Brief description of your issue"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
                maxLength={120}
              />
              <p className="text-xs text-gray-400 mt-1">{form.subject.length}/120</p>
            </div>

            {/* Description */}
            <div>
              <label className="label">Detailed Description <span className="text-red-500">*</span></label>
              <textarea
                className="input min-h-[160px] resize-y"
                placeholder="Please provide as much detail as possible — specific dates, amounts, order numbers, etc. help us resolve your issue faster."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
                minLength={10}
              />
            </div>

            {/* ── Attachment drop zone ── */}
            <div>
              <label className="label">
                Attachment (optional)
                <span className="text-gray-400 font-normal ml-1">— up to 5 files, 10 MB each</span>
              </label>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_EXT.join(',')}
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = '' }}
              />

              {/* Drop zone */}
              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors select-none
                  ${dragging
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'}`}
              >
                <Paperclip className={`w-5 h-5 mx-auto mb-2 ${dragging ? 'text-brand-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 font-medium">
                  {dragging ? 'Drop files here' : 'Drag & drop or click to attach files'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF · max 10 MB per file</p>
              </div>

              {/* File previews */}
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map(({ file, preview, id }) => (
                    <li key={id}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">

                      {/* Image thumbnail or icon */}
                      {preview ? (
                        <img src={preview} alt={file.name}
                          className="w-10 h-10 rounded object-cover shrink-0 border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <FileIcon type={file.type} />
                        </div>
                      )}

                      {/* Name & size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                      </div>

                      {/* Remove */}
                      <button type="button" onClick={() => removeFile(id)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Info box */}
            <div className="flex items-start gap-3 bg-blue-50 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                Your ticket will be automatically categorised and prioritised by our system.
                You'll receive updates on this page in real time — no need to refresh.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting…' : `Submit Ticket${files.length ? ` (${files.length} file${files.length > 1 ? 's' : ''})` : ''}`}
              </button>
            </div>

          </form>
        </div>
      </div>
    </AuthorLayout>
  )
}
