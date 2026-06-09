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
        
        // Generate UPI URI
        const upiId = portfolioData.payment.upiId;
        const name = encodeURIComponent(portfolioData.payment.payeeName);
        const amount = portfolioData.payment.processingFee.toFixed(2);
        
        const upiString = `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`;
        
        // Update Modal UI
        document.getElementById('upi-qr-code').src = qrCodeUrl;
        document.getElementById('upi-id-display').textContent = upiId;
        document.getElementById('payment-fee-display').textContent = `₹${portfolioData.payment.processingFee}`;
        
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
                    amount: portfolioData.payment.processingFee
                })
            });

            if (!res.ok) throw new Error("Failed to submit");
            
            const data = await res.json();
            
            // Save token and authenticate user locally
            localStorage.setItem('customerToken', data.token);
            checkAuth();

            // Switch from Payment to Success Modal
            paymentModal.classList.remove('active');
            successModal.classList.add('active');

            // Reset form
            projectForm.reset();
            document.getElementById('file-list').innerHTML = '';
            calculatePrice();

            btn.textContent = "I Have Paid";
            btn.disabled = false;

        } catch (error) {
            alert("Error: Could not connect to backend. Is node server.js running?");
            btn.textContent = "I Have Paid";
            btn.disabled = false;
        }
    };

    window.closeSuccessModal = () => {
        successModal.classList.remove('active');
        // Because of Go To Dashboard button, ensure we check auth
        checkAuth();
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
            let statusColor = p.status === 'pending' ? '#f59e0b' : (p.status === 'approved' ? '#10b981' : '#ef4444');
            let progressText = p.status === 'pending' ? 'Waiting for Developer Approval' : (p.status === 'approved' ? 'Development Started (Please pay 50% advance to continue)' : 'Rejected');
            
            html += `
                <div style="background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; margin-bottom: 1rem;">
                    <h3 style="margin-top: 0; color: #3b82f6;">${p.plan.charAt(0).toUpperCase() + p.plan.slice(1)} Website</h3>
                    <p style="margin: 0.5rem 0; color: var(--text-secondary);">Processing Fee Paid: ₹${p.amount}</p>
                    <p style="margin: 0.5rem 0; font-weight: bold;">Status: <span style="color: ${statusColor}; text-transform: uppercase;">${p.status}</span></p>
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155;">
                        <p style="margin: 0; font-size: 0.9rem; color: #cbd5e1;">Project Progress: <strong>${progressText}</strong></p>
                    </div>
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

});
