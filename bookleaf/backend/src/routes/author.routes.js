const express = require('express');
const router = express.Router();
const Author = require('../models/author.model');
const { authenticate, requireAuthor } = require('../middleware/auth.middleware');

// GET /api/author/profile - Get current author's profile + books
router.get('/profile', authenticate, requireAuthor, async (req, res) => {
  try {
    const author = await Author.findOne({ author_id: req.user.authorId });
    if (!author) return res.status(404).json({ error: 'Author profile not found' });
    res.json({ author });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/author/books - Get author's books
router.get('/books', authenticate, requireAuthor, async (req, res) => {
  try {
    const author = await Author.findOne({ author_id: req.user.authorId });
    if (!author) return res.status(404).json({ error: 'Author not found' });
    res.json({ books: author.books });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

module.exports = router;
