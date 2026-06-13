// script.js
// IMPORTANT: Leave this as an empty string when the backend serves the frontend files!
const API_BASE_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- POPULATE DATA ---

    // 1. Profile Section
    document.getElementById('hero-name').textContent = portfolioData.profile.name;
    document.getElementById('hero-role').textContent = portfolioData.profile.role;
    document.getElementById('hero-desc').textContent = portfolioData.profile.description;
    document.getElementById('hero-img').src = portfolioData.profile.image;
    document.title = `${portfolioData.profile.name} - ${portfolioData.profile.role}`;

    // --- FETCH REVIEWS ---
    async function loadReviews() {
        try {
            const res = await fetch(`${API_BASE_URL}/reviews`);
            const reviews = await res.json();
            const grid = document.getElementById('reviews-grid');
            
            if (reviews.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center;">Be the first to leave a review!</p>';
                return;
            }

            grid.innerHTML = reviews.map(r => `
                <div class="review-card">
                    <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                    <p class="review-text">"${r.comment}"</p>
                    <div class="review-author">
                        <div class="review-avatar">${r.name.charAt(0).toUpperCase()}</div>
                        <div>
                            <strong>${r.name}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(r.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            console.error("Failed to load reviews", e);
        }
    }
    loadReviews();

    // 2. Education Section
    const eduList = document.getElementById('education-list');
    portfolioData.education.forEach(edu => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-year">${edu.year}</div>
            <h3 class="timeline-degree">${edu.degree}</h3>
            <div class="timeline-institution">${edu.institution}</div>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">${edu.details}</p>
        `;
        eduList.appendChild(item);
    });

    // 3. Projects Section
    const projectsGrid = document.getElementById('projects-grid');
    portfolioData.projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div class="project-img-wrapper">
                <img src="${project.image}" alt="${project.title}" class="project-img">
            </div>
            <div class="project-info">
                <h3 class="project-title">${project.title}</h3>
                <p class="project-desc">${project.description}</p>
                <a href="${project.link}" class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View Project</a>
            </div>
        `;
        projectsGrid.appendChild(card);
    });

    // 4. Plans Section
    const plansGrid = document.getElementById('plans-grid');
    for (const [key, plan] of Object.entries(portfolioData.plans)) {
        const card = document.createElement('div');
        card.className = `plan-card ${plan.isPopular ? 'plan-popular' : ''}`;
        
        let featuresHtml = plan.features.map(f => `<li>${f}</li>`).join('');
        
        card.innerHTML = `
            ${plan.isPopular ? '<div class="plan-badge">Popular</div>' : ''}
            <h3 class="plan-name">${plan.name}</h3>
            <div class="plan-price">₹${plan.price.toLocaleString()}</div>
            <ul class="plan-features">
                ${featuresHtml}
            </ul>
            <button class="btn-primary btn-plan" onclick="selectPlan('${key}')">Select ${plan.name}</button>
        `;
        plansGrid.appendChild(card);
    }

    // Set current year
    document.getElementById('current-year').textContent = new Date().getFullYear();


    // --- FORM & PRICING LOGIC ---

    const planSelect = document.getElementById('plan-selection');
    const urgencySelect = document.getElementById('urgency');
    const estimatedPriceDisplay = document.getElementById('estimated-price');
    const fileUpload = document.getElementById('file-upload');
    const fileList = document.getElementById('file-list');
    
    let basePrice = portfolioData.plans['basic'].price; // Default
    let isUrgent = false;
    window.currentAdvanceAmount = 0; // NEW GLOBAL VARIABLE

    // Scroll and Select Plan
    window.selectPlan = (planKey) => {
        planSelect.value = planKey;
        calculatePrice();
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    };

    function calculatePrice() {
        const selectedPlan = planSelect.value;
        basePrice = portfolioData.plans[selectedPlan].price;
        
        isUrgent = urgencySelect.value === 'urgent';
        
        let total = basePrice;
        if (isUrgent) {
            total += total * 0.20; // 20% surcharge
        }
        
        estimatedPriceDisplay.textContent = `₹${total.toLocaleString()}`;
        
        // Calculate 50% advance
        window.currentAdvanceAmount = total * 0.5;
        document.getElementById('payment-fee-display').textContent = `₹${window.currentAdvanceAmount.toLocaleString()}`;
    }

    planSelect.addEventListener('change', calculatePrice);
    urgencySelect.addEventListener('change', calculatePrice);
    
    // Initial calculation
    calculatePrice();

    // File Upload Preview
    fileUpload.addEventListener('change', (e) => {
        fileList.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            const li = document.createElement('li');
            li.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            fileList.appendChild(li);
        });
    });

    // Form Submission / Manual Admin Flow
    const projectForm = document.getElementById('project-form');
    const paymentModal = document.getElementById('payment-modal');
    const successModal = document.getElementById('success-modal');



    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Generate UPI URI using dynamic 50% advance
        const upiId = portfolioData.payment.upiId;
        const name = encodeURIComponent(portfolioData.payment.payeeName);
        const amount = window.currentAdvanceAmount.toFixed(2);
        
        const upiString = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
        
        // Update Modal UI
        document.getElementById('upi-intent-link').href = upiString;
        document.getElementById('upi-qr-code').src = qrCodeUrl;
        document.getElementById('upi-id-display').textContent = upiId;
        document.getElementById('payment-fee-display').textContent = `₹${window.currentAdvanceAmount.toLocaleString()}`;
        
        // Show modal
        paymentModal.classList.add('active');
    });

    window.closeModal = () => {
        paymentModal.classList.remove('active');
    };

    window.processPayment = async () => {
        const btn = document.getElementById('btn-verify');
        btn.textContent = "Sending...";
        btn.disabled = true;

        try {
            // Submit to server
            const res = await fetch(`${API_BASE_URL}/submit-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    mobile: document.getElementById('mobile').value,
                    password: document.getElementById('password').value,
                    plan: document.getElementById('plan-selection').value,
                    description: document.getElementById('description').value,
                    amount: window.currentAdvanceAmount
                })
            });

            if (!res.ok) throw new Error("Failed to submit");
            
            const data = await res.json();
            
            // Save token and authenticate user locally
            localStorage.setItem('customerToken', data.token);
            localStorage.setItem('user_name', document.getElementById('name').value);
            
            closeModal();
            const successModal = document.getElementById('success-modal');
            successModal.classList.add('active');
            
            // Reload dashboard
            checkAuth();

        } catch (error) {
            alert("Error: Could not connect to backend. Is node server.js running?");
            btn.textContent = "I Have Paid Successfully";
            btn.disabled = false;
        }
    };

    window.closeSuccessModal = () => {
        document.getElementById('success-modal').classList.remove('active');
        document.getElementById('project-form').reset();
    };

    // --- REVIEWS LOGIC ---
    let currentRating = 5;
    const reviewModal = document.getElementById('review-modal');
    
    window.openReviewModal = () => {
        reviewModal.classList.add('active');
        // Reset stars
        currentRating = 5;
        document.querySelectorAll('#star-rating span').forEach(s => s.classList.add('active'));
    };

    window.closeReviewModal = () => {
        reviewModal.classList.remove('active');
    };

    // Star interaction
    document.querySelectorAll('#star-rating span').forEach(star => {
        star.addEventListener('click', (e) => {
            currentRating = parseInt(e.target.dataset.val);
            document.querySelectorAll('#star-rating span').forEach(s => {
                if (parseInt(s.dataset.val) <= currentRating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });

    window.submitReview = async () => {
        const name = document.getElementById('review-name').value;
        const comment = document.getElementById('review-comment').value;
        const btn = document.getElementById('btn-submit-review');

        if (!name || !comment) {
            alert("Please fill in all fields.");
            return;
        }

        btn.textContent = "Submitting...";
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/submit-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, rating: currentRating, comment })
            });

            if (!res.ok) throw new Error("Failed to submit review");
            
            closeReviewModal();
            document.getElementById('review-name').value = '';
            document.getElementById('review-comment').value = '';
            loadReviews(); // Refresh reviews
        } catch (err) {
            alert("Failed to submit review. Is the backend running?");
        } finally {
            btn.textContent = "Submit Review";
            btn.disabled = false;
        }
    };

    // --- Authentication & Dashboard Logic ---
    const loginModal = document.getElementById('login-modal');
    const contactSection = document.getElementById('contact');
    const dashboardSection = document.getElementById('customer-dashboard');
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navContact = document.getElementById('nav-contact');

    window.openLoginModal = () => loginModal.classList.add('active');
    window.closeLoginModal = () => loginModal.classList.remove('active');

    window.submitLogin = async () => {
        const mobile = document.getElementById('login-mobile').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('btn-login-submit');
        
        btn.textContent = 'Logging in...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password })
            });

            if (!res.ok) {
                alert("Invalid mobile number or password.");
                btn.textContent = 'Login';
                btn.disabled = false;
                return;
            }

            const data = await res.json();
            localStorage.setItem('customerToken', data.token);
            closeLoginModal();
            checkAuth();
            
            btn.textContent = 'Login';
            btn.disabled = false;
        } catch (err) {
            alert("Error connecting to server.");
            btn.textContent = 'Login';
            btn.disabled = false;
        }
    };

    window.logout = () => {
        localStorage.removeItem('customerToken');
        checkAuth();
    };

    async function checkAuth() {
        const token = localStorage.getItem('customerToken');
        if (!token) {
            // Not logged in
            contactSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            navLogin.style.display = 'inline-block';
            navLogout.style.display = 'none';
            navContact.style.display = 'inline-block';
            return;
        }

        // Try to fetch dashboard data
        try {
            const res = await fetch(`${API_BASE_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                // Token invalid or expired
                localStorage.removeItem('customerToken');
                checkAuth();
                return;
            }

            const data = await res.json();
            renderDashboard(data.user, data.payments);

            // Logged in successfully
            contactSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            navLogin.style.display = 'none';
            navLogout.style.display = 'inline-block';
            navContact.style.display = 'none';
        } catch (err) {
            console.error("Dashboard error:", err);
        }
    }

    function renderDashboard(user, payments) {
        document.getElementById('dashboard-welcome').textContent = `Welcome back, ${user.name}!`;
        const list = document.getElementById('dashboard-projects');
        
        if (payments.length === 0) {
            list.innerHTML = `<p style="color: var(--text-secondary);">You have no project requests yet.</p>`;
            return;
        }

        let html = '';
        payments.forEach(p => {
            let statusColor = '#f59e0b';
            if (p.status === 'approved') statusColor = '#10b981';
            if (p.status === 'rejected') statusColor = '#ef4444';
            if (p.status === 'completed') statusColor = '#3b82f6';
            
            let progressText = 'Waiting for Developer to Verify Payment';
            if (p.status === 'approved') progressText = 'Development Started (The remaining 50% payment is due when the website is completely finished)';
            if (p.status === 'rejected') progressText = 'Rejected';
            if (p.status === 'completed') progressText = '<span style="color: #3b82f6;">Website is Complete! Please pay the remaining 50% fee to receive your source code and live link.</span>';
            
            let finalPaymentHtml = '';
            if (p.status === 'completed') {
                const upiId = portfolioData.payment.upiId;
                const name = encodeURIComponent(portfolioData.payment.payeeName);
                const upiString = `upi://pay?pa=${upiId}&pn=${name}&am=${p.amount}&cu=INR`;
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;

                finalPaymentHtml = `
                    <div style="margin-top: 1.5rem; padding: 1.5rem; background: rgba(59, 130, 246, 0.1); border: 1px dashed var(--accent); border-radius: 8px;">
                        <h4 style="margin-top: 0; color: white; text-align: center; font-size: 1.2rem;">Pay Remaining Balance: <span style="color: var(--accent);">₹${p.amount}</span></h4>
                        <a href="${upiString}" class="btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #fff; color: #1f2937; margin-bottom: 1rem; text-decoration: none; padding: 0.8rem; border-radius: 8px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            <strong>Pay via GPay / PhonePe</strong>
                        </a>
                        <div style="display: flex; align-items: center; margin: 1rem 0;">
                            <hr style="flex: 1; border-color: rgba(255,255,255,0.1);">
                            <span style="padding: 0 1rem; color: var(--text-secondary); font-size: 0.85rem;">OR SCAN QR</span>
                            <hr style="flex: 1; border-color: rgba(255,255,255,0.1);">
                        </div>
                        <img src="${qrCodeUrl}" alt="Final Payment QR" style="width: 150px; height: 150px; margin: 0 auto 0.5rem; display: block; border-radius: 8px; border: 3px solid white;">
                        <p style="text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0;">UPI ID: <strong>${upiId}</strong></p>
                    </div>
                `;
            }

            html += `
                <div style="background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; margin-bottom: 1rem;">
                    <h3 style="margin-top: 0; color: #3b82f6;">${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} Website</h3>
                    <p style="margin: 0.5rem 0; color: var(--text-secondary);">Advance Paid: ₹${p.amount}</p>
                    <p style="margin: 0.5rem 0; font-weight: bold;">Status: <span style="color: ${statusColor}; text-transform: uppercase;">${p.status}</span></p>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155;">
                        <p style="margin: 0; font-size: 0.9rem; color: #cbd5e1;">Project Progress: <strong>${progressText}</strong></p>
                    </div>
                    ${finalPaymentHtml}
                </div>
            `;
        });
        list.innerHTML = html;
        
        // Scroll to dashboard
        dashboardSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Run auth check on page load
    checkAuth();

    // Hamburger Menu Logic
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navItems = document.querySelectorAll('.nav-item');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // ==========================================
    // CUSTOM LIVE CHAT LOGIC
    // ==========================================
    
    const chatOverlay = document.getElementById('chat-overlay');
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    
    const chatSetup = document.getElementById('chat-setup');
    const chatCustomerNameInput = document.getElementById('chat-customer-name');
    const chatStartBtn = document.getElementById('chat-start-btn');
    
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    let chatSessionId = localStorage.getItem('chatSessionId');
    let chatCustomerName = localStorage.getItem('chatCustomerName');
    let chatPollInterval = null;

    // Toggle Window
    chatToggleBtn.addEventListener('click', () => {
        const isOpening = chatWindow.style.display === 'none';
        chatWindow.style.display = isOpening ? 'flex' : 'none';
        chatOverlay.style.display = isOpening ? 'block' : 'none';
        
        // Lock background scrolling on mobile
        if (window.innerWidth <= 768) {
            document.body.style.overflow = isOpening ? 'hidden' : '';
        }

        if (isOpening) {
            checkChatState();
        } else {
            clearInterval(chatPollInterval);
        }
    });

    function closeChat() {
        chatWindow.style.display = 'none';
        chatOverlay.style.display = 'none';
        document.body.style.overflow = '';
        clearInterval(chatPollInterval);
    }

    chatCloseBtn.addEventListener('click', closeChat);
    chatOverlay.addEventListener('click', closeChat);

    function checkChatState() {
        if (chatSessionId && chatCustomerName) {
            chatSetup.style.display = 'none';
            chatMessagesContainer.style.display = 'flex';
            loadChatMessages();
            startPolling();
        } else {
            chatSetup.style.display = 'flex';
            chatMessagesContainer.style.display = 'none';
        }
    }

    // Start Chat
    chatStartBtn.addEventListener('click', () => {
        const name = chatCustomerNameInput.value.trim();
        if (!name) return alert("Please enter your name.");
        
        chatCustomerName = name;
        chatSessionId = 'sess_' + Date.now() + Math.random().toString(36).substr(2, 5);
        
        localStorage.setItem('chatCustomerName', chatCustomerName);
        localStorage.setItem('chatSessionId', chatSessionId);
        
        checkChatState();
    });

    // Load Messages
    async function loadChatMessages() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat/${chatSessionId}`);
            if (!res.ok) return;
            const data = await res.json();
            renderMessages(data.messages);
        } catch (err) {
            console.error("Chat Error:", err);
        }
    }

    function renderMessages(messages) {
        if (!messages || messages.length === 0) {
            chatMessagesDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-size: 0.8rem; margin-top: 1rem;">Send a message to start chatting!</p>';
            return;
        }

        chatMessagesDiv.innerHTML = messages.map(m => {
            const isMe = !m.isAdmin;
            return `
                <div class="chat-msg ${isMe ? 'customer' : 'admin'}">
                    <div class="msg-sender">${m.sender}</div>
                    ${m.text}
                </div>
            `;
        }).join('');
        
        // Scroll to bottom
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }

    // Send Message
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        chatInput.value = '';
        
        try {
            await fetch(`${API_BASE_URL}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: chatSessionId,
                    name: chatCustomerName,
                    text: text,
                    isAdmin: false
                })
            });
            loadChatMessages();
        } catch (err) {
            console.error("Failed to send message", err);
        }
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Polling
    function startPolling() {
        clearInterval(chatPollInterval);
        chatPollInterval = setInterval(loadChatMessages, 3000);
    }

});
