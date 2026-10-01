//register1.js
// Switch between voter and candidate registration
function switchRole(role) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.registration-form');

    tabs.forEach(tab => {
        if (tab.dataset.role === role) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    forms.forEach(form => {
        if (form.id === role + 'Form') {
            form.classList.add('active');
        } else {
            form.classList.remove('active');
        }
    });

    clearAllErrors();
}

// Toggle password visibility
function togglePassword(inputId, element) {
    const input = document.getElementById(inputId);
    const icon = element.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Handle registration
function handleRegister(event, role) {
    event.preventDefault();
    clearAllErrors();

    const prefix = role === 'voter' ? 'voter' : 'candidate';
    const name = document.getElementById(prefix + 'Name').value.trim();
    const email = document.getElementById(prefix + 'Email').value.trim();
    const phone = document.getElementById(prefix + 'Phone').value.trim();
    const password = document.getElementById(prefix + 'Password').value.trim();
    const party = role === 'candidate' ? document.getElementById('candidateParty').value.trim() : null;

    // Validation
    let isValid = true;

    if (!name) {
        showError(prefix + 'NameError', 'Name is required');
        isValid = false;
    }

    if (!isValidEmail(email)) {
        showError(prefix + 'EmailError', 'Please enter a valid email');
        isValid = false;
    }

    if (!isValidPhone(phone)) {
        showError(prefix + 'PhoneError', 'Please enter a valid 10-digit phone number');
        isValid = false;
    }

    if (!isValidPassword(password)) {
        showError(prefix + 'PasswordError', 'Password must be 8+ chars with 1 uppercase & 1 special char');
        isValid = false;
    }

    if (role === 'candidate' && !party) {
        showError('candidatePartyError', 'Party name is required');
        isValid = false;
    }

    if (!isValid) return false;

    // Register user
    const userData = {
        name,
        email,
        phone,
        password
    };

    if (role === 'candidate') {
        userData.party = party;
    }

    console.log('📝 Registering user:', { role, ...userData });
    const result = registerUser(role, userData);
    console.log('📋 Registration result:', result);

    if (result.success) {
        console.log('✓ Registration successful, redirecting to login...');

        // NEW: For candidate registration, save data for candidate dashboard
        if (role === 'candidate') {
            // Prepare candidate data in the format expected by candidate dashboard
            const candidateData = {
                id: result.user.id || 'cand_' + Date.now(),
                email: result.user.email,
                password: result.user.password,
                name: result.user.name,
                phone: result.user.phone,
                party: result.user.party || 'Independent',
                bio: '',
                image: '',
                registrationDate: result.user.registeredDate || new Date().toISOString().split('T')[0],
                verified: true
            };

            // Save to localStorage for candidate dashboard
            localStorage.setItem('lastRegisteredCandidate', JSON.stringify(candidateData));
            console.log('✓ Saved candidate data to localStorage for dashboard');

            // Also save to sessionStorage for immediate login
            sessionStorage.setItem('tempRegisteredCandidate', JSON.stringify(candidateData));
            sessionStorage.setItem('tempRegisteredRole', 'candidate');
        }

        showToast('✓ Registration successful! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } else {
        console.log('✗ Registration failed:', result.message);
        showError(prefix + 'EmailError', result.message);
    }

    return false;
}

// Validation functions
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function isValidPassword(password) {
    return /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = message;
}

function showToast(message) {
    const toast = document.getElementById('successToast');
    const messageEl = document.getElementById('toastMessage');
    messageEl.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}