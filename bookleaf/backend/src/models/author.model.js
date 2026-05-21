const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  book_id: String,
  title: String,
  isbn: String,
  genre: String,
  publication_date: String,
  status: String,
  mrp: Number,
  author_royalty_per_copy: Number,
  total_copies_sold: { type: Number, default: 0 },
  total_royalty_earned: { type: Number, default: 0 },
  royalty_paid: { type: Number, default: 0 },
  royalty_pending: { type: Number, default: 0 },
  last_royalty_payout_date: String,
  print_partner: String,
  available_on: [String]
});

const authorSchema = new mongoose.Schema({
  author_id: { type: String, unique: true },
  name: String,
  email: { type: String, unique: true, lowercase: true },
  phone: String,
  city: String,
  joined_date: String,
  books: [bookSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Author', authorSchema);
