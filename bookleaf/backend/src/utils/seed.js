require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Author = require('../models/author.model');
const Ticket = require('../models/ticket.model');

const sampleData = {
  "authors": [
    { "author_id": "AUTH001", "name": "Priya Sharma", "email": "priya.sharma@email.com", "phone": "+91-98765-43210", "city": "Mumbai", "joined_date": "2023-03-15", "books": [{ "book_id": "BK001", "title": "Whispers of the Ganges", "isbn": "978-93-5XXXX-01-1", "genre": "Literary Fiction", "publication_date": "2023-06-20", "status": "Published & Live", "mrp": 399, "author_royalty_per_copy": 35, "total_copies_sold": 342, "total_royalty_earned": 11970, "royalty_paid": 8400, "royalty_pending": 3570, "last_royalty_payout_date": "2025-10-15", "print_partner": "In-House", "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"] }, { "book_id": "BK002", "title": "The Saffron Diaries", "isbn": "978-93-5XXXX-02-8", "genre": "Non-Fiction / Memoir", "publication_date": "2024-01-10", "status": "Published & Live", "mrp": 450, "author_royalty_per_copy": 42, "total_copies_sold": 189, "total_royalty_earned": 7938, "royalty_paid": 7938, "royalty_pending": 0, "last_royalty_payout_date": "2025-12-01", "print_partner": "In-House", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH002", "name": "Rohit Kapoor", "email": "rohit.kapoor@email.com", "phone": "+91-87654-32109", "city": "Delhi", "joined_date": "2022-11-08", "books": [{ "book_id": "BK003", "title": "Code & Karma", "isbn": "978-93-5XXXX-03-5", "genre": "Self-Help / Technology", "publication_date": "2023-02-14", "status": "Published & Live", "mrp": 350, "author_royalty_per_copy": 30, "total_copies_sold": 876, "total_royalty_earned": 26280, "royalty_paid": 21000, "royalty_pending": 5280, "last_royalty_payout_date": "2025-09-01", "print_partner": "Repro India", "available_on": ["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"] }, { "book_id": "BK004", "title": "Startup Sutra", "isbn": "978-93-5XXXX-04-2", "genre": "Business / Entrepreneurship", "publication_date": "2024-05-22", "status": "Published & Live", "mrp": 499, "author_royalty_per_copy": 48, "total_copies_sold": 1203, "total_royalty_earned": 57744, "royalty_paid": 50000, "royalty_pending": 7744, "last_royalty_payout_date": "2025-11-15", "print_partner": "In-House", "available_on": ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"] }] },
    { "author_id": "AUTH003", "name": "Ananya Reddy", "email": "ananya.reddy@email.com", "phone": "+91-76543-21098", "city": "Hyderabad", "joined_date": "2024-02-20", "books": [{ "book_id": "BK005", "title": "Between Two Temples", "isbn": "978-93-5XXXX-05-9", "genre": "Historical Fiction", "publication_date": "2024-07-05", "status": "Published & Live", "mrp": 425, "author_royalty_per_copy": 38, "total_copies_sold": 67, "total_royalty_earned": 2546, "royalty_paid": 0, "royalty_pending": 2546, "last_royalty_payout_date": null, "print_partner": "Epitome Books", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH004", "name": "Vikram Joshi", "email": "vikram.joshi@email.com", "phone": "+91-65432-10987", "city": "Pune", "joined_date": "2023-07-12", "books": [{ "book_id": "BK006", "title": "Debugging Life", "isbn": "978-93-5XXXX-06-6", "genre": "Self-Help", "publication_date": "2023-11-30", "status": "Published & Live", "mrp": 299, "author_royalty_per_copy": 25, "total_copies_sold": 534, "total_royalty_earned": 13350, "royalty_paid": 10000, "royalty_pending": 3350, "last_royalty_payout_date": "2025-08-20", "print_partner": "In-House", "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"] }, { "book_id": "BK007", "title": "The Last Monsoon", "isbn": "978-93-5XXXX-07-3", "genre": "Poetry", "publication_date": "2024-08-15", "status": "Published & Live", "mrp": 199, "author_royalty_per_copy": 15, "total_copies_sold": 123, "total_royalty_earned": 1845, "royalty_paid": 1845, "royalty_pending": 0, "last_royalty_payout_date": "2025-12-01", "print_partner": "In-House", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH005", "name": "Meera Nair", "email": "meera.nair@email.com", "phone": "+91-54321-09876", "city": "Kochi", "joined_date": "2023-01-05", "books": [{ "book_id": "BK008", "title": "Cardamom & Chaos", "isbn": "978-93-5XXXX-08-0", "genre": "Contemporary Fiction", "publication_date": "2023-04-18", "status": "Published & Live", "mrp": 375, "author_royalty_per_copy": 32, "total_copies_sold": 445, "total_royalty_earned": 14240, "royalty_paid": 14240, "royalty_pending": 0, "last_royalty_payout_date": "2025-12-01", "print_partner": "Repro India", "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"] }, { "book_id": "BK009", "title": "Letters from Lakshadweep", "isbn": "978-93-5XXXX-09-7", "genre": "Travel / Non-Fiction", "publication_date": "2024-03-01", "status": "Published & Live", "mrp": 550, "author_royalty_per_copy": 55, "total_copies_sold": 201, "total_royalty_earned": 11055, "royalty_paid": 8000, "royalty_pending": 3055, "last_royalty_payout_date": "2025-10-15", "print_partner": "In-House", "available_on": ["Amazon India", "Amazon US", "BookLeaf Store"] }] },
    { "author_id": "AUTH006", "name": "Arjun Malhotra", "email": "arjun.malhotra@email.com", "phone": "+91-43210-98765", "city": "Chandigarh", "joined_date": "2024-06-01", "books": [{ "book_id": "BK010", "title": "Turban Tales", "isbn": "978-93-5XXXX-10-3", "genre": "Humor / Essays", "publication_date": "2024-09-10", "status": "Published & Live", "mrp": 325, "author_royalty_per_copy": 28, "total_copies_sold": 88, "total_royalty_earned": 2464, "royalty_paid": 0, "royalty_pending": 2464, "last_royalty_payout_date": null, "print_partner": "In-House", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH007", "name": "Sneha Kulkarni", "email": "sneha.kulkarni@email.com", "phone": "+91-32109-87654", "city": "Bangalore", "joined_date": "2022-09-18", "books": [{ "book_id": "BK011", "title": "The Algorithm of Love", "isbn": "978-93-5XXXX-11-0", "genre": "Romance", "publication_date": "2022-12-25", "status": "Published & Live", "mrp": 299, "author_royalty_per_copy": 25, "total_copies_sold": 1567, "total_royalty_earned": 39175, "royalty_paid": 35000, "royalty_pending": 4175, "last_royalty_payout_date": "2025-11-15", "print_partner": "Repro India", "available_on": ["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"] }, { "book_id": "BK012", "title": "Ctrl+Alt+Delete My Ex", "isbn": "978-93-5XXXX-12-7", "genre": "Romance / Humor", "publication_date": "2024-02-14", "status": "Published & Live", "mrp": 350, "author_royalty_per_copy": 30, "total_copies_sold": 723, "total_royalty_earned": 21690, "royalty_paid": 18000, "royalty_pending": 3690, "last_royalty_payout_date": "2025-10-15", "print_partner": "In-House", "available_on": ["Amazon India", "Flipkart", "BookLeaf Store"] }, { "book_id": "BK013", "title": "Midnight in Mysore", "isbn": "978-93-5XXXX-13-4", "genre": "Thriller", "publication_date": null, "status": "In Production - Cover Design", "mrp": null, "author_royalty_per_copy": null, "total_copies_sold": 0, "total_royalty_earned": 0, "royalty_paid": 0, "royalty_pending": 0, "last_royalty_payout_date": null, "print_partner": null, "available_on": [] }] },
    { "author_id": "AUTH008", "name": "Farhan Sheikh", "email": "farhan.sheikh@email.com", "phone": "+91-21098-76543", "city": "Lucknow", "joined_date": "2023-10-01", "books": [{ "book_id": "BK014", "title": "Ghazal of the Forgotten", "isbn": "978-93-5XXXX-14-1", "genre": "Poetry / Urdu Literature", "publication_date": "2024-01-26", "status": "Published & Live", "mrp": 250, "author_royalty_per_copy": 20, "total_copies_sold": 156, "total_royalty_earned": 3120, "royalty_paid": 3120, "royalty_pending": 0, "last_royalty_payout_date": "2025-12-01", "print_partner": "Epitome Books", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH009", "name": "Kavita Deshmukh", "email": "kavita.deshmukh@email.com", "phone": "+91-10987-65432", "city": "Nagpur", "joined_date": "2024-04-10", "books": [{ "book_id": "BK015", "title": "Raising Roots", "isbn": "978-93-5XXXX-15-8", "genre": "Parenting / Non-Fiction", "publication_date": null, "status": "In Production - Typesetting", "mrp": null, "author_royalty_per_copy": null, "total_copies_sold": 0, "total_royalty_earned": 0, "royalty_paid": 0, "royalty_pending": 0, "last_royalty_payout_date": null, "print_partner": null, "available_on": [] }, { "book_id": "BK016", "title": "The Nagpur Notebooks", "isbn": "978-93-5XXXX-16-5", "genre": "Essays / Memoir", "publication_date": "2024-11-05", "status": "Published & Live", "mrp": 299, "author_royalty_per_copy": 25, "total_copies_sold": 34, "total_royalty_earned": 850, "royalty_paid": 0, "royalty_pending": 850, "last_royalty_payout_date": null, "print_partner": "In-House", "available_on": ["Amazon India", "BookLeaf Store"] }] },
    { "author_id": "AUTH010", "name": "Diya Chatterjee", "email": "diya.chatterjee@email.com", "phone": "+91-09876-54321", "city": "Kolkata", "joined_date": "2023-05-22", "books": [{ "book_id": "BK017", "title": "Durga's Daughters", "isbn": "978-93-5XXXX-17-2", "genre": "Literary Fiction", "publication_date": "2023-10-15", "status": "Published & Live", "mrp": 475, "author_royalty_per_copy": 45, "total_copies_sold": 612, "total_royalty_earned": 27540, "royalty_paid": 25000, "royalty_pending": 2540, "last_royalty_payout_date": "2025-11-15", "print_partner": "Repro India", "available_on": ["Amazon India", "Flipkart", "Amazon US", "BookLeaf Store"] }, { "book_id": "BK018", "title": "Howrah Nights", "isbn": "978-93-5XXXX-18-9", "genre": "Crime / Thriller", "publication_date": "2025-01-20", "status": "Published & Live", "mrp": 399, "author_royalty_per_copy": 35, "total_copies_sold": 45, "total_royalty_earned": 1575, "royalty_paid": 0, "royalty_pending": 1575, "last_royalty_payout_date": null, "print_partner": "In-House", "available_on": ["Amazon India", "BookLeaf Store"] }] }
  ]
};

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookleaf';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Author.deleteMany({});
  await Ticket.deleteMany({});
  console.log('Cleared existing data');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  await User.create({
    email: process.env.ADMIN_EMAIL || 'admin@bookleaf.com',
    password: adminPassword,
    name: 'BookLeaf Admin',
    role: 'admin'
  });
  console.log('✅ Admin user created');
  console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@bookleaf.com'}`);
  console.log(`   Password: ${adminPassword}`);

  // Create authors and their users
  for (const authorData of sampleData.authors) {
    await Author.create(authorData);
    
    // Create user account for each author (password = Author@123)
    await User.create({
      email: authorData.email,
      password: 'Author@123',
      name: authorData.name,
      role: 'author',
      authorId: authorData.author_id
    });
  }
  console.log(`✅ ${sampleData.authors.length} authors seeded`);

  // Create sample tickets
  const authorUsers = await User.find({ role: 'author' });
  
  const sampleTickets = [
    {
      authorIdx: 0,
      bookTitle: 'Whispers of the Ganges',
      bookId: 'BK001',
      subject: 'Royalty payment not received for last quarter',
      description: 'I published my book in June 2023 and I have not received my royalty payment for the last quarter. My royalty pending shows ₹3,570. When will this be processed? It has been over 3 months.',
      status: 'Open'
    },
    {
      authorIdx: 1,
      bookTitle: 'Startup Sutra',
      bookId: 'BK004',
      subject: 'Book showing unavailable on Amazon US',
      description: 'My book Startup Sutra is showing as Currently Unavailable on Amazon US since 2 days. It was available before. Please look into this urgently as this affects my international sales.',
      status: 'In Progress'
    },
    {
      authorIdx: 6,
      bookTitle: 'Midnight in Mysore',
      bookId: 'BK013',
      subject: 'When will my book be ready? It has been 3 weeks in Cover Design',
      description: 'My book Midnight in Mysore has been in Cover Design stage for over 3 weeks now. I approved the cover design 10 days ago but the status has not changed. Can you please update me on when it will move to the next stage?',
      status: 'Resolved'
    },
    {
      authorIdx: 2,
      bookTitle: 'Between Two Temples',
      bookId: 'BK005',
      subject: 'ISBN on physical copy does not match Amazon listing',
      description: 'I just received my author copies and noticed the ISBN printed on the physical book does not match what is showing on Amazon India. This could cause serious confusion for readers and affect sales. Please treat this as urgent.',
      status: 'Open'
    },
    {
      authorIdx: 9,
      bookTitle: 'Howrah Nights',
      bookId: 'BK018',
      subject: 'Print quality issue - pages misaligned',
      description: 'I received 10 author copies of Howrah Nights and 6 out of 10 copies have misaligned pages in chapter 3-5. The text is cut off on the right side. I am sharing photos. Please arrange a reprint.',
      status: 'Open'
    }
  ];

  for (const t of sampleTickets) {
    const author = authorUsers[t.authorIdx];
    await Ticket.create({
      authorId: author._id,
      authorName: author.name,
      authorEmail: author.email,
      bookId: t.bookId,
      bookTitle: t.bookTitle,
      subject: t.subject,
      description: t.description,
      status: t.status,
      category: t.authorIdx === 0 ? 'Royalty & Payments' :
                t.authorIdx === 1 ? 'Distribution & Availability' :
                t.authorIdx === 6 ? 'Book Status & Production Updates' :
                t.authorIdx === 2 ? 'ISBN & Metadata Issues' : 'Printing & Quality',
      priority: t.authorIdx === 2 ? 'Critical' : t.authorIdx === 4 ? 'High' : 'Medium',
      priorityScore: t.authorIdx === 2 ? 90 : t.authorIdx === 4 ? 70 : 50,
      messages: [{
        sender: 'author',
        senderId: author._id,
        senderName: author.name,
        content: t.description,
        isInternal: false
      }]
    });
  }
  console.log(`✅ ${sampleTickets.length} sample tickets created`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@bookleaf.com / Admin@123');
  console.log('Author: priya.sharma@email.com / Author@123');
  console.log('Author: rohit.kapoor@email.com / Author@123');
  console.log('(All authors use password: Author@123)');
  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
