// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, script.js, style.css, etc.)
const path = require('path');
app.use(express.static(__dirname));

// In-memory databases
let payments = [];
let users = []; // Store users { mobile, name, password }
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "anshul123";
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
    const { name, mobile, password, amount, plan } = req.body;
    
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
    const user = users.find(u => u.mobile === mobile && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: "Invalid mobile number or password" });
    }
    
    const token = jwt.sign({ mobile: user.mobile, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: "Logged in successfully" });
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

// Middleware to check Admin Password
const verifyAdmin = (req, res, next) => {
    const pass = req.headers['x-admin-password'];
    if (pass !== ADMIN_PASSWORD) {
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

// 5. Admin Rejects Payment
app.post('/admin/reject/:id', verifyAdmin, (req, res) => {
    const payment = payments.find(p => p.id === req.params.id);
    if (!payment) return res.status(404).json({ error: "Not found" });
    
    payment.status = 'rejected';
    res.json({ message: "Payment rejected" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running securely on http://localhost:${PORT}`);
    console.log(`Admin Password is: ${ADMIN_PASSWORD}`);
});
