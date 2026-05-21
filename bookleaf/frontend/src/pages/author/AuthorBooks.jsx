import { useEffect, useState } from 'react'
import AuthorLayout from '../../components/author/AuthorLayout'
import api from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { BookMarked, Globe, Package, TrendingUp } from 'lucide-react'

export default function AuthorBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/author/books').then(res => setBooks(res.data.books)).finally(() => setLoading(false))
  }, [])

  if (loading) return <AuthorLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div></AuthorLayout>

  return (
    <AuthorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
          <p className="text-gray-500 text-sm mt-0.5">{books.length} book{books.length !== 1 ? 's' : ''} in your catalog</p>
        </div>

        {books.length === 0 ? (
          <div className="card px-8 py-16 text-center">
            <BookMarked className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No books in your catalog yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map(book => (
              <div key={book.book_id} className="card overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{book.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{book.genre} · ISBN: {book.isbn}</p>
                  </div>
                  <span className={`badge shrink-0 mt-1 ${book.status === 'Published & Live' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {book.status}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                  {[
                    { label: 'MRP', value: book.mrp ? formatCurrency(book.mrp) : '—' },
                    { label: 'Copies Sold', value: (book.total_copies_sold || 0).toLocaleString() },
                    { label: 'Total Earned', value: formatCurrency(book.total_royalty_earned) },
                    { label: 'Pending Payout', value: formatCurrency(book.royalty_pending), highlight: book.royalty_pending > 0 },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="px-6 py-4">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className={`text-base font-semibold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                  {book.publication_date && (
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Published {formatDate(book.publication_date)}
                    </span>
                  )}
                  {book.last_royalty_payout_date && (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Last payout {formatDate(book.last_royalty_payout_date)}
                    </span>
                  )}
                  {book.print_partner && (
                    <span>Print: {book.print_partner}</span>
                  )}
                  {book.available_on?.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      {book.available_on.join(' · ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthorLayout>
  )
}
