const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['author', 'admin'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  content: String,
  isInternal: { type: Boolean, default: false }, // Internal notes not visible to author
  createdAt: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  authorEmail: String,

  // Query details
  bookId: String,  // book_id or 'general'
  bookTitle: String,
  subject: String,
  description: String,
  attachmentUrl: String, // optional

  // AI Classification
  category: {
    type: String,
    enum: [
      'Royalty & Payments',
      'ISBN & Metadata Issues',
      'Printing & Quality',
      'Distribution & Availability',
      'Book Status & Production Updates',
      'General Inquiry'
    ],
    default: 'General Inquiry'
  },
  categoryOverridden: { type: Boolean, default: false },

  // Priority
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  priorityScore: { type: Number, default: 50 }, // 0-100
  priorityOverridden: { type: Boolean, default: false },

  // Status
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },

  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName: String,

  // Messages thread
  messages: [messageSchema],

  // Attachments
  attachments: [{
    originalName: String,
    filename: String,
    mimetype: String,
    size: Number,
    url: String
  }],

  // AI draft (not sent, just stored for admin use)
  aiDraftResponse: String,
  aiDraftGeneratedAt: Date,

  // Metadata
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

// Auto-generate ticket number
ticketSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `BL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
