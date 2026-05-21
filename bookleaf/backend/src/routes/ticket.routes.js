const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/ticket.model');
const Author = require('../models/author.model');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { classifyTicket, generateDraftResponse } = require('../services/ai.service');
const { sendEvent, broadcastToAdmins } = require('../services/sse.service');

// ── Multer setup — store files in uploads/ folder ──────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
});

// POST /api/tickets - Create a new ticket (author)
router.post('/', authenticate, upload.array('attachments', 5), [
  body('subject').notEmpty().trim(),
  body('description').notEmpty().trim().isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { bookId, bookTitle, subject, description } = req.body;

    // Build attachment metadata from uploaded files
    const attachments = (req.files || []).map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      mimetype: f.mimetype,
      size: f.size,
      url: `/uploads/${f.filename}`
    }));
    
    // Get author data for context
    let authorData = null;
    if (req.user.authorId) {
      authorData = await Author.findOne({ author_id: req.user.authorId });
    }

    // AI classification (non-blocking - fallback if fails)
    const classification = await classifyTicket(subject, description, bookTitle);

    const ticket = new Ticket({
      authorId: req.user._id,
      authorName: req.user.name,
      authorEmail: req.user.email,
      bookId: bookId || 'general',
      bookTitle: bookTitle || 'General / Account Level',
      subject,
      description,
      attachments,
      category: classification.category,
      priority: classification.priority,
      priorityScore: classification.priorityScore,
      messages: [{
        sender: 'author',
        senderId: req.user._id,
        senderName: req.user.name,
        content: description,
        isInternal: false
      }]
    });

    await ticket.save();

    // Generate AI draft in background (non-blocking)
    generateDraftResponse(ticket, authorData).then(async ({ draft }) => {
      await Ticket.findByIdAndUpdate(ticket._id, {
        aiDraftResponse: draft,
        aiDraftGeneratedAt: new Date()
      });
    }).catch(err => console.warn('Draft generation failed:', err.message));

    // Notify admins of new ticket
    broadcastToAdmins({ type: 'new_ticket', ticket: ticket.toObject() });

    res.status(201).json({ ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets - Get tickets (author sees own, admin sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = req.user.role === 'admin' ? {} : { authorId: req.user._id };
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Ticket.countDocuments(filter);

    res.json({ tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Authors can only view own tickets
    if (req.user.role === 'author' && ticket.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter out internal messages for authors
    let ticketData = ticket.toObject();
    if (req.user.role === 'author') {
      ticketData.messages = ticketData.messages.filter(m => !m.isInternal);
      delete ticketData.aiDraftResponse;
    }

    res.json({ ticket: ticketData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets/:id/messages - Add message/response to ticket
router.post('/:id/messages', authenticate, [
  body('content').notEmpty().trim(),
  body('isInternal').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role === 'author' && ticket.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const isInternal = req.user.role === 'admin' && req.body.isInternal === true;
    const message = {
      sender: req.user.role === 'admin' ? 'admin' : 'author',
      senderId: req.user._id,
      senderName: req.user.name,
      content: req.body.content,
      isInternal
    };

    ticket.messages.push(message);

    // Update status when admin responds
    if (req.user.role === 'admin' && !isInternal && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    // Notify relevant parties
    if (req.user.role === 'admin' && !isInternal) {
      sendEvent(ticket.authorId.toString(), { type: 'ticket_updated', ticketId: ticket._id, message });
    }
    if (req.user.role === 'author') {
      broadcastToAdmins({ type: 'ticket_reply', ticketId: ticket._id, ticketNumber: ticket.ticketNumber });
    }

    res.json({ message, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// PATCH /api/tickets/:id - Update ticket (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, category, priority, assignedTo, assignedToName, categoryOverridden, priorityOverridden } = req.body;
    const update = {};
    
    if (status) {
      update.status = status;
      if (status === 'Resolved') update.resolvedAt = new Date();
      if (status === 'Closed') update.closedAt = new Date();
    }
    if (category) { update.category = category; update.categoryOverridden = true; }
    if (priority) { update.priority = priority; update.priorityOverridden = true; }
    if (assignedTo !== undefined) {
      update.assignedTo = assignedTo;
      update.assignedToName = assignedToName || req.user.name;
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Notify author of status changes
    if (status) {
      sendEvent(ticket.authorId.toString(), {
        type: 'ticket_status_changed',
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status
      });
    }

    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

module.exports = router;
