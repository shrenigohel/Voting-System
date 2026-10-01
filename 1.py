// Centralized Storage System for E-Voting
const EVotingStorage = {
    // Data stores
    voters: [],
    candidates: [],
    admins: [],
    elections: [],
    votes: [],
    results: [],
    applications: [],

    // Current session
    currentUser: null,
    currentRole: null,

    initialized: false,

    // Initialize sample data
    init: function () {
        if (this.initialized) return;

        // Sample Voters
        this.voters = [
            {
                id: 'V001',
                name: 'Krishna Kumar',
                email: 'krishna@gmail.com',
                password: 'Voter@123',
                phone: '+91 9876543210',
                voterId: 'VOTER00123',
                address: '123 Main St, Bangalore',
                registeredDate: '2025-12-15',
                lastLogin: null,
                voted: false
            },
            {
                id: 'V002',
                name: 'Priya Sharma',
                email: 'priya@gmail.com',
                password: 'Voter@123',
                phone: '+91 9876543211',
                voterId: 'VOTER00124',
                address: '456 Park Ave, Mumbai',
                registeredDate: '2025-12-16',
                lastLogin: null,
                voted: false
            }
        ];

        // Sample Candidates
        this.candidates = [
            {
                id: 'C001',
                name: 'John Candidate',
                email: 'john@evoting.com',
                password: 'candidate@123',
                phone: '+1 555-123-4567',
                party: 'Democratic Party',
                bio: 'Experienced public servant with 10 years of community leadership.',
                registeredDate: '2025-01-15',
                lastLogin: null
            },
            {
                id: 'C002',
                name: 'Alice Brown',
                email: 'alice@evoting.com',
                password: 'candidate@123',
                phone: '+1 555-987-6543',
                party: 'Progressive Party',
                bio: 'Youth activist focused on sustainable development.',
                registeredDate: '2025-02-10',
                lastLogin: null
            }
        ];

        // Sample Admins
        this.admins = [
            {
                id: 'A001',
                name: 'Admin User',
                email: 'admin@gmail.com',
                password: 'Admin@123',
                phone: '+91 9999999999',
                role: 'Super Administrator',
                department: 'Administration',
                registeredDate: '2024-01-01',
                lastLogin: null
            }
        ];

        // Sample Elections
        this.elections = [
            {
                id: 1,
                name: 'General Election 2026',
                areas: 'North, South, East, West',
                status: 'Closed',
                startDate: '2026-01-01',
                endDate: '2026-01-10',
                seats: 10,
                candidates: [
                    { name: 'John Doe', party: 'Democratic Party' },
                    { name: 'Jane Smith', party: 'Republican Party' }
                ]
            },
            {
                id: 2,
                name: 'Student Council Election 2026',
                areas: 'University Campus',
                status: 'Open',
                startDate: '2026-01-15',
                endDate: '2026-01-25',
                seats: 5,
                candidates: [
                    { name: 'Alice Brown', party: 'Student Unity' },
                    { name: 'Bob Wilson', party: 'Campus Forward' }
                ]
            },
            {
                id: 3,
                name: 'Local Body Election 2026',
                areas: 'District 1, District 2',
                status: 'Open',
                startDate: '2026-01-18',
                endDate: '2026-01-28',
                seats: 8,
                candidates: [
                    { name: 'David Lee', party: 'Civic Alliance' },
                    { name: 'Emma White', party: 'United Front' }
                ]
            },
            {
                id: 4,
                name: 'State Assembly Election 2026',
                areas: 'Statewide',
                status: 'Upcoming',
                startDate: '2026-02-01',
                endDate: '2026-02-10',
                seats: 15,
                candidates: []
            }
        ];

        // Sample Results
        this.results = [
            { candidate: 'John Doe', party: 'Democratic Party', votes: 1256 },
            { candidate: 'Jane Smith', party: 'Republican Party', votes: 989 },
            { candidate: 'Alice Brown', party: 'Student Unity', votes: 645 },
            { candidate: 'Bob Wilson', party: 'Campus Forward', votes: 587 }
        ];

        // Sample Applications
        this.applications = [
            {
                id: 'APP001',
                electionId: 1,
                candidateEmail: 'john@evoting.com',
                candidateName: 'John Candidate',
                party: 'Democratic Party',
                reason: 'I want to represent student interests',
                appliedDate: 'Jan 10, 2026',
                status: 'approved'
            }
        ];

        this.initialized = true;
        console.log('✅ E-Voting Storage initialized');
    }
};

// Authenticate user
function authenticateUser(role, email, password) {
    console.log('🔐 Authenticating:', { role, email, password });

    let user = null;

    // First check if admin and use admin_storage
    if (role === 'admin') {
        // Try to load from adminStorage
        if (typeof adminStorage !== 'undefined' && adminStorage.admin) {
            const admin = adminStorage.admin;
            if (admin.email === email && admin.password === password) {
                user = admin;
                console.log('✅ Admin authenticated from adminStorage');
            }
        }

        // Also check EVotingStorage admins
        if (!user) {
            user = EVotingStorage.admins.find(a => a.email === email && a.password === password);
        }
    } else {
        // Check localStorage for voters/candidates
        if (typeof LocalStorageManager !== 'undefined') {
            if (role === 'voter') {
                user = LocalStorageManager.getVoterByEmail(email);
            } else if (role === 'candidate') {
                user = LocalStorageManager.getCandidateByEmail(email);
            }
        }

        // If not found, check EVotingStorage
        if (!user) {
            if (role === 'voter') {
                user = EVotingStorage.voters.find(v => v.email === email && v.password === password);
            } else if (role === 'candidate') {
                user = EVotingStorage.candidates.find(c => c.email === email && c.password === password);
            }
        }
    }

    if (user && user.password === password) {
        user.lastLogin = new Date().toISOString();
        EVotingStorage.currentUser = user;
        EVotingStorage.currentRole = role;

        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('currentRole', role);

        // For admin, also set in adminStorage
        if (role === 'admin') {
            if (typeof setCurrentAdmin !== 'undefined') {
                setCurrentAdmin(user);
            } else {
                // ✅ FIX: admin_storage.js isn't loaded on login page, so store directly
                // in localStorage so getCurrentAdmin() finds it on admin.html
                try {
                    const existingRaw = localStorage.getItem('adminStorage');
                    const existing = existingRaw ? JSON.parse(existingRaw) : {};
                    existing.admin = user;
                    localStorage.setItem('adminStorage', JSON.stringify(existing));
                } catch (e) { }
            }
        }

        console.log('✅ Login successful:', { email, role });
        return { success: true, user: user };
    }

    console.log('❌ Login failed:', { email, role });
    return { success: false, message: 'Invalid credentials. Please try again.' };
}

// Get current user
function getCurrentUser() {
    if (EVotingStorage.currentUser) {
        return EVotingStorage.currentUser;
    }

    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        EVotingStorage.currentUser = JSON.parse(savedUser);
        EVotingStorage.currentRole = sessionStorage.getItem('currentRole');
        return EVotingStorage.currentUser;
    }

    return null;
}

// Get current role
function getCurrentRole() {
    if (EVotingStorage.currentRole) {
        return EVotingStorage.currentRole;
    }

    return sessionStorage.getItem('currentRole');
}

// Logout
function logout() {
    EVotingStorage.currentUser = null;
    EVotingStorage.currentRole = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentRole');
}

// Get all elections
function getAllElections() {
    EVotingStorage.init();
    return EVotingStorage.elections;
}

// Get election by ID
function getElectionById(id) {
    EVotingStorage.init();
    return EVotingStorage.elections.find(e => e.id == id);
}

// Get user by email (searches across all user types)
function getUserByEmail(email) {
    // Check localStorage first
    if (typeof LocalStorageManager !== 'undefined') {
        const voter = LocalStorageManager.getVoterByEmail(email);
        if (voter) return voter;

        const candidate = LocalStorageManager.getCandidateByEmail(email);
        if (candidate) return candidate;
    }

    // Fall back to EVotingStorage
    EVotingStorage.init();
    return EVotingStorage.voters.find(v => v.email === email) ||
        EVotingStorage.candidates.find(c => c.email === email) ||
        EVotingStorage.admins.find(a => a.email === email);
}

// Set current user
function setCurrentUser(user) {
    if (user) {
        EVotingStorage.currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }
}

// Load persisted user data from localStorage
function loadPersistedUserData() {
    try {
        console.log('📂 Loading persisted user data from localStorage...');

        if (typeof LocalStorageManager === 'undefined') {
            console.log('❌ LocalStorageManager not available');
            return;
        }

        // Load voters
        const registeredVoters = LocalStorageManager.getAllVoters();
        if (registeredVoters.length > 0) {
            // Merge with existing voters, avoiding duplicates
            const existingEmails = EVotingStorage.voters.map(v => v.email);
            const newVoters = registeredVoters.filter(v => !existingEmails.includes(v.email));
            EVotingStorage.voters.push(...newVoters);
            console.log(`✓ Loaded ${newVoters.length} registered voters from localStorage`);
        }

        // Load candidates
        const registeredCandidates = LocalStorageManager.getAllCandidates();
        if (registeredCandidates.length > 0) {
            // Merge with existing candidates, avoiding duplicates
            const existingEmails = EVotingStorage.candidates.map(c => c.email);
            const newCandidates = registeredCandidates.filter(c => !existingEmails.includes(c.email));
            EVotingStorage.candidates.push(...newCandidates);
            console.log(`✓ Loaded ${newCandidates.length} registered candidates from localStorage`);
        }

        console.log('📊 Total voters available:', EVotingStorage.voters.length);
        console.log('📊 Total candidates available:', EVotingStorage.candidates.length);
    } catch (error) {
        console.error('❌ Error loading persisted user data:', error);
    }
}

// Initialize on load
EVotingStorage.init();
// Load persisted data - use setTimeout to ensure all scripts are loaded
setTimeout(function () {
    loadPersistedUserData();
}, 0);