// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "anshul2268";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "226812@a";

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://anshul:anshul123@anshulchat.ndrnl0v.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Anshulchat";
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB for Permanent Chat'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// --- MONGODB MODELS ---
const chatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lastActive: { type: Number, default: Date.now },
    messages: [{
        id: String,
        sender: String,
        text: String,
        timestamp: Number,
        isAdmin: Boolean
    }]
});
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

// In-memory databases (for non-chat features)
let payments = [];
let users = []; // Store users { mobile, name, password }
let reviews = [
    { id: '7', name: 'Vikram Mehta', rating: 5, comment: 'Anshul completely transformed our outdated website into a modern, high-converting platform. His attention to detail and ability to understand our business needs was exceptional. The project was delivered ahead of schedule!', date: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: '6', name: 'Neha Gupta', rating: 5, comment: 'I hired Anshul to build a custom dashboard for our logistics company. The UI is incredibly intuitive, and the backend is rock solid. He is definitely one of the best freelance developers I have worked with.', date: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: '5', name: 'Rahul Desai', rating: 4, comment: 'Great communication and solid technical skills. Anshul built our e-commerce store from scratch and integrated all the payment gateways flawlessly. Very happy with the final product.', date: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: '4', name: 'Sarah Williams', rating: 5, comment: 'Working with Anshul was a breeze. He took our basic Figma designs and turned them into a pixel-perfect, fully responsive web application. His React and Node.js skills are top-tier.', date: new Date(Date.now() - 14 * 86400000).toISOString() },
    { id: '3', name: 'Amit Chawla', rating: 5, comment: 'Highly professional and dedicated. Anshul not only delivered exactly what we asked for but also suggested SEO and performance improvements that significantly boosted our site speed.', date: new Date(Date.now() - 20 * 86400000).toISOString() },
    { id: '2', name: 'Priya Patel', rating: 5, comment: 'The UI/UX design is top-notch. Highly recommend Anshul for any custom web application needs. He is responsive and very easy to work with.', date: new Date(Date.now() - 30 * 86400000).toISOString() },
    { id: '1', name: 'Rohan Sharma', rating: 5, comment: 'Anshul built an incredible e-commerce platform for my business. Very professional and fast delivery! Will definitely hire again.', date: new Date(Date.now() - 45 * 86400000).toISOString() }
];
const JWT_SECRET = "supersecretjwtkey"; // For demo purposes
// --- CUSTOMER ENDPOINTS ---

// Middleware to check Customer JWT
const verifyCustomer = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded; // { mobile, name }
        next();
    });
};

// 1. Customer Submits Payment & Registers Account
app.post('/submit-payment', (req, res) => {
    const { name, mobile, password, amount, plan, description } = req.body;
    
    // Create or update user
    let user = users.find(u => u.mobile === mobile);
    if (!user) {
        user = { name, mobile, password }; // In a real app, hash this password!
        users.push(user);
    } else {
        // If user exists, optionally verify password here if they are trying to submit while logged out
        // but for simplicity we'll just let them append a payment if mobile matches.
    }

    const transactionId = crypto.randomBytes(8).toString('hex');
    const newPayment = {
        id: transactionId,
        name,
        mobile,
        amount,
        plan,
        description: description || "No description provided.",
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    payments.unshift(newPayment);

    // Generate JWT token
    const token = jwt.sign({ mobile: user.mobile, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, message: "Payment submitted & Account created!" });
});

// 2. Customer Logs In
app.post('/login', (req, res) => {
    const { mobile, password } = req.body;
    const user = users.find(u => u.mobile === mobile);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid mobile or password" });
    }
    const token = jwt.sign({ mobile: user.mobile, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name });
});

// --- REVIEWS API ---

// Get all reviews
app.get('/reviews', (req, res) => {
    res.json(reviews);
});

// Submit a new review
app.post('/submit-review', (req, res) => {
    const { name, rating, comment } = req.body;
    if (!name || !rating || !comment) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    
    const newReview = {
        id: crypto.randomBytes(4).toString('hex'),
        name,
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString()
    };
    
    // Add to beginning of array
    reviews.unshift(newReview);
    res.json({ message: "Review submitted successfully", review: newReview });
});

// 3. Customer Gets Their Profile & Payments
app.get('/me', verifyCustomer, (req, res) => {
    const userPayments = payments.filter(p => p.mobile === req.user.mobile);
    res.json({
        user: req.user,
        payments: userPayments
    });
});

// --- ADMIN ENDPOINTS ---

// --- ADMIN MIDDLEWARE ---
const verifyAdmin = (req, res, next) => {
    const user = req.headers['x-admin-username'];
    const pass = req.headers['x-admin-password'];
    
    if (user !== ADMIN_USERNAME || pass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
};

// 3. Admin Gets All Payments
app.get('/admin/payments', verifyAdmin, (req, res) => {
    res.json(payments);
});

// 4. Admin Approves Payment
app.post('/admin/approve/:id', verifyAdmin, (req, res) => {
    const payment = payments.find(p => p.id === req.params.id);
    if (!payment) return res.status(404).json({ error: "Not found" });
    
    payment.status = 'approved';
    res.json({ message: "Payment approved successfully" });
});

// 5. Admin Marks Project as Completed
app.post('/admin/complete/:id', verifyAdmin, (req, res) => {
    const payment = payments.find(p => p.id === req.params.id);
    if (!payment) return res.status(404).json({ error: "Not found" });
    
    payment.status = 'completed';
    res.json({ message: "Project marked as completed" });
});

// 5. Admin Rejects Payment
app.post('/admin/reject/:id', verifyAdmin, (req, res) => {
    const payment = payments.find(p => p.id === req.params.id);
    if (!payment) return res.status(404).json({ error: "Not found" });
    
    payment.status = 'rejected';
    res.json({ message: "Payment rejected" });
});

// ==========================================
// LIVE CHAT API ENDPOINTS (MONGODB)
// ==========================================

// 1. Send Message (Customer or Admin)
app.post('/api/chat/send', async (req, res) => {
    try {
        const { sessionId, name, text, isAdmin } = req.body;
        
        if (!sessionId || !text) {
            return res.status(400).json({ error: "Missing sessionId or text" });
        }

        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            session = new ChatSession({
                sessionId,
                name: name || 'Anonymous User',
                lastActive: Date.now(),
                messages: []
            });
        }

        // Update name if customer provided it later
        if (name && !isAdmin) {
            session.name = name;
        }

        const message = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            sender: isAdmin ? 'Anshul (Admin)' : session.name,
            text,
            timestamp: Date.now(),
            isAdmin: isAdmin || false
        };

        session.messages.push(message);
        session.lastActive = Date.now();
        await session.save();
        
        res.json({ success: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// 2. Get Messages for a Session (Customer)
app.get('/api/chat/:sessionId', async (req, res) => {
    try {
        const session = await ChatSession.findOne({ sessionId: req.params.sessionId });
        if (!session) return res.json({ messages: [] });
        res.json({ messages: session.messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// 3. Get All Chats (Admin Only)
app.get('/admin/chats', verifyAdmin, async (req, res) => {
    try {
        // Return sessions sorted by most recently active
        const sessions = await ChatSession.find().sort({ lastActive: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running securely on http://localhost:${PORT}`);
    console.log(`Admin Username is: ${ADMIN_USERNAME}`);
    console.log(`Admin Password is: ${ADMIN_PASSWORD}`);
});
