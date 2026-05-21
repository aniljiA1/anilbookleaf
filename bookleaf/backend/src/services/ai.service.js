// AI Service - supports both OpenAI and Google Gemini
// Gracefully degrades if AI is unavailable

const BOOKLEAF_KNOWLEDGE_BASE = `
BOOKLEAF PUBLISHING - KNOWLEDGE BASE FOR SUPPORT

## Company Overview
BookLeaf Publishing is a self-publishing company operating in India and the US.
We offer publishing packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
We handle cover design, typesetting, ISBN assignment, printing, distribution, and royalty management for our authors.
Our in-house printing facility and warehouse are located in Delhi. We also work with print partners including Repro India and Epitome Books.

## Royalty Policy
- BookLeaf follows an 80/20 royalty split: 80% of the net profit per book goes to the author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.
- Payouts are made via bank transfer to the account linked in the author's dashboard.
- Authors can view a detailed royalty breakdown in their dashboard.

## ISBN Policy
- Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf.
- ISBNs are registered under BookLeaf's publisher imprint.
- If an author wants an ISBN under their own imprint, they need to obtain it independently.
- ISBN errors (duplicate, wrong book linked) are treated as high-priority and escalated to the production team.

## Printing & Quality
- In-house printing handles most orders. Overflow goes to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects): BookLeaf arranges a free reprint after verification.
- Author may need to share photos of the defective copy.

## Distribution & Availability
- Books are listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- "Currently Unavailable" on a platform usually indicates a stock sync issue — BookLeaf's team can trigger a re-sync within 24–48 hours.

## Production Stages
Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.
Delays typically happen at Cover Design (waiting for author approval) and Proofreading (revision rounds).
Authors are updated at each stage via email.

## Communication Tone
- Always empathetic and professional. Authors are partners, not customers to be managed.
- Acknowledge the author's concern before jumping to solutions.
- Be specific: include actual numbers, dates, and statuses wherever possible.
- If something is BookLeaf's fault, own it directly.
- Give clear timelines for escalations ("Our team will look into this within 48 hours").
- Always end with a clear next step.
`;

const CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

// Fallback rule-based classification when AI is unavailable
const ruleBasedClassify = (subject, description) => {
  const text = `${subject} ${description}`.toLowerCase();
  if (text.match(/royalt|payment|pay|money|earning|payout|paid|income/)) return 'Royalty & Payments';
  if (text.match(/isbn|metadata|title|description|cover|amazon listing|barcode/)) return 'ISBN & Metadata Issues';
  if (text.match(/print|quality|blurry|misalign|binding|paper|physical|defect|copy/)) return 'Printing & Quality';
  if (text.match(/unavailable|distribution|amazon|flipkart|store|available|stock/)) return 'Distribution & Availability';
  if (text.match(/status|production|typeset|proofreading|editing|cover design|publish|progress/)) return 'Book Status & Production Updates';
  return 'General Inquiry';
};

const ruleBasedPriority = (subject, description) => {
  const text = `${subject} ${description}`.toLowerCase();
  if (text.match(/haven't received.*royalt|no royalt.*month|overdue|urgent|critical|isbn.*error|wrong isbn/)) return { priority: 'Critical', score: 90 };
  if (text.match(/royalt.*low|quality.*terrible|not available|months.*wait|escalat/)) return { priority: 'High', score: 70 };
  if (text.match(/when.*publish|status.*update|bio.*update|description.*change/)) return { priority: 'Low', score: 25 };
  return { priority: 'Medium', score: 50 };
};

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const OpenAI = require('openai');
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    return null;
  }
};

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch {
    return null;
  }
};

const callAI = async (systemPrompt, userPrompt) => {
  const provider = process.env.AI_PROVIDER || 'gemini';

  if (provider === 'openai') {
    const client = getOpenAIClient();
    if (!client) throw new Error('OpenAI client not available');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  }

  if (provider === 'gemini') {
    const genAI = getGeminiClient();
    if (!genAI) throw new Error('Gemini client not available');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    return result.response.text();
  }

  throw new Error('No AI provider configured');
};

// Classify and prioritize a ticket
const classifyTicket = async (subject, description, bookTitle = '') => {
  try {
    const prompt = `You are a support ticket classifier for BookLeaf Publishing.

Classify this support ticket:
Subject: ${subject}
Description: ${description}
${bookTitle ? `Book: ${bookTitle}` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "category": "<one of: Royalty & Payments | ISBN & Metadata Issues | Printing & Quality | Distribution & Availability | Book Status & Production Updates | General Inquiry>",
  "priority": "<one of: Critical | High | Medium | Low>",
  "priorityScore": <number 0-100>,
  "reasoning": "<brief one sentence explanation>"
}

Priority guide:
- Critical (85-100): Financial issues unpaid for 6+ months, ISBN errors, data corruption
- High (60-84): Quality issues, significant delays, royalty discrepancies  
- Medium (35-59): Status inquiries, moderate delays
- Low (0-34): Minor questions, metadata updates, general info requests`;

    const text = await callAI('You are a support ticket classifier. Always respond with valid JSON only.', prompt);
    
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(cleaned);
    
    return {
      category: CATEGORIES.includes(result.category) ? result.category : ruleBasedClassify(subject, description),
      priority: PRIORITIES.includes(result.priority) ? result.priority : 'Medium',
      priorityScore: Number(result.priorityScore) || 50,
      aiUsed: true
    };
  } catch (err) {
    console.warn('AI classification failed, using rule-based fallback:', err.message);
    const category = ruleBasedClassify(subject, description);
    const { priority, score } = ruleBasedPriority(subject, description);
    return { category, priority, priorityScore: score, aiUsed: false };
  }
};

// Generate AI draft response for a ticket
const generateDraftResponse = async (ticket, authorData) => {
  try {
    const authorContext = authorData ? `
Author: ${authorData.name} (${authorData.email}), based in ${authorData.city}
Books: ${authorData.books.map(b => `
  - "${b.title}" (${b.status}): ${b.total_copies_sold} copies sold, ₹${b.royalty_earned || b.total_royalty_earned} earned, ₹${b.royalty_pending} pending`).join('')}
` : '';

    const ticketContext = ticket.bookTitle && ticket.bookTitle !== 'General / Account Level' ? `
Related Book: ${ticket.bookTitle}
` : '';

    const prompt = `${BOOKLEAF_KNOWLEDGE_BASE}

---
TICKET TO RESPOND TO:
Ticket Number: ${ticket.ticketNumber}
Category: ${ticket.category}
Priority: ${ticket.priority}
Subject: ${ticket.subject}
Description: ${ticket.description}

${authorContext}
${ticketContext}

Write a professional support response from BookLeaf Publishing to this author.
- Follow the communication tone guidelines in the knowledge base exactly
- Be specific: use the author's actual data (royalty amounts, book titles, dates) if available
- Acknowledge their concern first
- Provide a clear solution or next steps
- End with a clear action item
- Sign as "BookLeaf Support Team"
- Keep response to 150-250 words
- Do NOT use placeholders like [X] or [DATE] - use actual data or say "our records show..."`;

    const draft = await callAI(
      'You are a professional author support representative at BookLeaf Publishing. Write warm, specific, helpful responses.',
      prompt
    );
    return { draft, aiUsed: true };
  } catch (err) {
    console.warn('AI draft generation failed:', err.message);
    return {
      draft: `Dear ${ticket.authorName || 'Author'},

Thank you for reaching out to BookLeaf Publishing regarding "${ticket.subject}".

We have received your query and our support team will review it shortly. We aim to respond to all tickets within 24-48 hours.

If this is urgent, please let us know and we will prioritize accordingly.

Best regards,
BookLeaf Support Team`,
      aiUsed: false
    };
  }
};

module.exports = { classifyTicket, generateDraftResponse, CATEGORIES };
