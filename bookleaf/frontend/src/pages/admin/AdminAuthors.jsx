import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Users, BookOpen, MapPin, Calendar, Search } from 'lucide-react'

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/authors').then(res => setAuthors(res.data.authors)).finally(() => setLoading(false))
  }, [])

  const filtered = authors.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Authors</h1>
            <p className="text-gray-500 text-sm mt-0.5">{authors.length} authors in the system</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search authors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(author => {
              const totalEarned = author.books.reduce((s, b) => s + (b.total_royalty_earned || 0), 0)
              const totalPending = author.books.reduce((s, b) => s + (b.royalty_pending || 0), 0)
              const totalSold = author.books.reduce((s, b) => s + (b.total_copies_sold || 0), 0)
              const published = author.books.filter(b => b.status === 'Published & Live').length
              return (
                <div key={author.author_id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-900">{author.name}</h2>
                      <p className="text-xs text-gray-500">{author.email}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">{author.author_id}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{author.city}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {formatDate(author.joined_date)}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{author.books.length} book{author.books.length !== 1 ? 's' : ''} ({published} live)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 rounded-lg p-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Sold</p>
                      <p className="text-sm font-semibold text-gray-900">{totalSold.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Earned</p>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalEarned)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending</p>
                      <p className={`text-sm font-semibold ${totalPending > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {formatCurrency(totalPending)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {author.books.map(book => (
                      <div key={book.book_id} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700 truncate pr-2">{book.title}</span>
                        <span className={`badge shrink-0 ${book.status === 'Published & Live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {book.status === 'Published & Live' ? 'Live' : 'Production'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card px-8 py-16 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No authors found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
