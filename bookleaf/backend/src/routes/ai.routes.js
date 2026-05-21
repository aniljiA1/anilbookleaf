const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.model');
const Author = require('../models/author.model');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { generateDraftResponse, classifyTicket } = require('../services/ai.service');

// POST /api/ai/generate-draft/:ticketId - Regenerate AI draft for a ticket
router.post('/generate-draft/:ticketId', authenticate, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    let authorData = null;
    const authorUser = await require('../models/user.model').findById(ticket.authorId);
    if (authorUser?.authorId) {
      authorData = await Author.findOne({ author_id: authorUser.authorId });
    }

    const { draft, aiUsed } = await generateDraftResponse(ticket, authorData);

    await Ticket.findByIdAndUpdate(ticket._id, {
      aiDraftResponse: draft,
      aiDraftGeneratedAt: new Date()
    });

    res.json({ draft, aiUsed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate draft' });
  }
});

// POST /api/ai/reclassify/:ticketId - Re-run AI classification
router.post('/reclassify/:ticketId', authenticate, requireAdmin, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const classification = await classifyTicket(ticket.subject, ticket.description, ticket.bookTitle);
    res.json({ classification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reclassify ticket' });
  }
});

module.exports = router;
