const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.model');
const Author = require('../models/author.model');
const User = require('../models/user.model');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// GET /api/admin/dashboard - Stats for admin dashboard
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const [total, open, inProgress, resolved, critical] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ priority: 'Critical' })
    ]);

    // Category breakdown
    const categoryBreakdown = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent tickets
    const recentTickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      stats: { total, open, inProgress, resolved, critical },
      categoryBreakdown,
      recentTickets
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/admin/tickets - All tickets with filters
router.get('/tickets', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const tickets = await Ticket.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Ticket.countDocuments(filter);
    res.json({ tickets, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/admin/authors - All authors
router.get('/authors', authenticate, requireAdmin, async (req, res) => {
  try {
    const authors = await Author.find().lean();
    res.json({ authors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

module.exports = router;
