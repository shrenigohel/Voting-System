// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('userPassword');
    const toggleIcon = document.getElementById('toggleIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();

    const role = document.getElementById('userRole').value;
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;

    // Validate inputs
    if (!role) {
        alert('Please select a role');
        return;
    }

    if (!email) {
        alert('Please enter email');
        return;
    }

    if (!password) {
        alert('Please enter password');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    console.log('🔐 Attempting login:', { email, role });

    // Authenticate user
    const result = authenticateUser(role, email, password);

    if (!result.success) {
        alert(result.message);
        console.log('❌ Login failed:', result.message);
        return;
    }

    // Login successful
    console.log('✅ Login successful:', result.user);

    // Show success message
    alert('Login successful! Redirecting...');

    // Redirect based on role
    if (role === 'admin') {
        window.location.href = 'admin.html';
    } else if (role === 'candidate') {
        window.location.href = 'candidate.html';
    } else {
        window.location.href = 'user.html';
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if user is logged in
function checkAuth() {
    const user = getCurrentUser();
    const role = getCurrentRole();

    if (user && role) {
        console.log('User already logged in:', { user, role });
        return true;
    }
    return false;
}

// Auto-redirect if already logged in
document.addEventListener('DOMContentLoaded', function () {
    if (checkAuth()) {
        const role = getCurrentRole();
        if (role === 'admin') {
            window.location.href = 'admin.html';
        } else if (role === 'candidate') {
            window.location.href = 'candidate.html';
        } else if (role === 'voter') {
            window.location.href = 'user.html';
        }
    }
});