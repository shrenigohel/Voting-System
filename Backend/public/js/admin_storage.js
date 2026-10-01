// Admin Storage Management
let adminStorage = {
    admin: null,
    elections: [],
    candidates: [],
    voters: [],
    results: [],
    notifications: [],
    activities: [],
    initialized: false
};

// Initialize from localStorage if available
function loadStorage() {
    try {
        const saved = localStorage.getItem('adminStorage');
        if (saved) {
            adminStorage = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading storage:', e);
    }
}

// Save to localStorage
function saveStorage() {
    try {
        localStorage.setItem('adminStorage', JSON.stringify(adminStorage));
    } catch (e) {
        console.error('Error saving storage:', e);
    }
}

// Admin Management
function setCurrentAdmin(admin) {
    adminStorage.admin = admin;
    saveStorage();
    addActivity('login', 'Admin logged in');
}

function getCurrentAdmin() {
    loadStorage();
    if (adminStorage.admin) return adminStorage.admin;

    // ✅ FIX: Fall back to sessionStorage set by login page
    try {
        const role = sessionStorage.getItem('currentRole');
        const user = sessionStorage.getItem('currentUser');
        if (role === 'admin' && user) {
            const parsed = JSON.parse(user);
            adminStorage.admin = parsed;
            saveStorage();
            return parsed;
        }
    } catch (e) { }

    return null;
}

function updateAdmin(admin) {
    adminStorage.admin = admin;
    saveStorage();
}

function logoutAdmin() {
    addActivity('logout', 'Admin logged out');
    adminStorage.admin = null;
    saveStorage();
    // ✅ FIX: Also clear sessionStorage to prevent redirect loop on login page
    try {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentRole');
    } catch (e) { }
}

// Election Management
function addElection(election) {
    if (!election.id) {
        election.id = Date.now();
    }
    adminStorage.elections.push(election);
    saveStorage();
    addActivity('election', `Election "${election.name}" created`, election.id);
    return election;
}

function getElections() {
    return adminStorage.elections || [];
}

function getElectionById(id) {
    return adminStorage.elections.find(e => e.id == id);
}

function updateElection(id, election) {
    const index = adminStorage.elections.findIndex(e => e.id == id);
    if (index !== -1) {
        adminStorage.elections[index] = { ...adminStorage.elections[index], ...election };
        saveStorage();
        addActivity('election', `Election "${election.name}" updated`, id);
        return true;
    }
    return false;
}

function removeElection(id) {
    const election = adminStorage.elections.find(e => e.id == id);
    adminStorage.elections = adminStorage.elections.filter(e => e.id != id);
    saveStorage();
    if (election) {
        addActivity('election', `Election "${election.name}" deleted`, id);
    }
}

// Candidate Management
function addCandidate(candidate) {
    adminStorage.candidates.push(candidate);
    saveStorage();
    addActivity('candidate', `Candidate "${candidate.name}" added`, candidate.email);
    return candidate;
}

function getCandidates() {
    return adminStorage.candidates || [];
}

function getCandidateByEmail(email) {
    return adminStorage.candidates.find(c => c.email === email);
}

function updateCandidate(email, updates) {
    const index = adminStorage.candidates.findIndex(c => c.email === email);
    if (index !== -1) {
        adminStorage.candidates[index] = { ...adminStorage.candidates[index], ...updates };
        saveStorage();
        addActivity('candidate', `Candidate "${updates.name || 'Unknown'}" updated`, email);
        return true;
    }
    return false;
}

function removeCandidate(email) {
    const candidate = adminStorage.candidates.find(c => c.email === email);
    adminStorage.candidates = adminStorage.candidates.filter(c => c.email !== email);
    saveStorage();
    if (candidate) {
        addActivity('candidate', `Candidate "${candidate.name}" deleted`, email);
    }
}

// Voter Management
function addVoter(voter) {
    adminStorage.voters.push(voter);
    saveStorage();
    addActivity('voter', `Voter "${voter.name}" registered`, voter.voterId);
    return voter;
}

function getVoters() {
    return adminStorage.voters || [];
}

function getVoterById(voterId) {
    return adminStorage.voters.find(v => v.voterId === voterId);
}

function updateVoter(voterId, updates) {
    const index = adminStorage.voters.findIndex(v => v.voterId === voterId);
    if (index !== -1) {
        adminStorage.voters[index] = { ...adminStorage.voters[index], ...updates };
        saveStorage();
        addActivity('voter', `Voter "${updates.name || 'Unknown'}" updated`, voterId);
        return true;
    }
    return false;
}

function removeVoter(voterId) {
    const voter = adminStorage.voters.find(v => v.voterId === voterId);
    adminStorage.voters = adminStorage.voters.filter(v => v.voterId !== voterId);
    saveStorage();
    if (voter) {
        addActivity('voter', `Voter "${voter.name}" deleted`, voterId);
    }
}

// Results Management
function getResults() {
    return adminStorage.results || [];
}

function addResult(result) {
    adminStorage.results.push(result);
    saveStorage();
}

function updateResults(electionId, results) {
    adminStorage.results = adminStorage.results.filter(r => r.electionId != electionId);
    adminStorage.results.push(...results);
    saveStorage();
    addActivity('result', `Results updated for election ID: ${electionId}`, electionId);
}

// Notification Management
function getNotifications() {
    return adminStorage.notifications || [];
}

function addNotification(notification) {
    if (!notification.id) {
        notification.id = Date.now();
    }
    if (!notification.timestamp) {
        notification.timestamp = new Date().toISOString();
    }
    if (notification.read === undefined) {
        notification.read = false;
    }
    adminStorage.notifications.unshift(notification);
    if (adminStorage.notifications.length > 50) {
        adminStorage.notifications.pop();
    }
    saveStorage();
}

function markNotificationRead(id) {
    const notification = adminStorage.notifications.find(n => n.id == id);
    if (notification) {
        notification.read = true;
        saveStorage();
    }
}

function markAllNotificationsRead() {
    adminStorage.notifications.forEach(n => n.read = true);
    saveStorage();
}

function getUnreadNotificationCount() {
    return adminStorage.notifications.filter(n => !n.read).length;
}

function clearNotifications() {
    adminStorage.notifications = [];
    saveStorage();
}

// Activity Management
function addActivity(type, description, reference = null) {
    const activity = {
        id: Date.now(),
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        description,
        reference,
        timestamp: new Date().toISOString(),
        icon: type === 'election' ? 'calendar-check' :
            type === 'candidate' ? 'user-tie' :
                type === 'voter' ? 'user-plus' :
                    type === 'result' ? 'chart-bar' :
                        type === 'login' ? 'sign-in-alt' :
                            type === 'logout' ? 'sign-out-alt' :
                                type === 'export' ? 'download' : 'info-circle'
    };

    if (!adminStorage.activities) {
        adminStorage.activities = [];
    }

    adminStorage.activities.unshift(activity);

    if (adminStorage.activities.length > 100) {
        adminStorage.activities = adminStorage.activities.slice(0, 100);
    }

    saveStorage();

    // Add notification for important activities
    if (['election', 'candidate', 'voter', 'result'].includes(type)) {
        addNotification({
            id: Date.now() + 1,
            type: 'info',
            title: activity.title,
            message: description,
            timestamp: new Date().toISOString(),
            read: false
        });
    }
}

function getActivities() {
    return adminStorage.activities || [];
}

function getRecentActivities(limit = 10) {
    const activities = getActivities();
    return activities.slice(0, limit).map(activity => ({
        icon: activity.icon || 'info-circle',
        title: activity.title || activity.type,
        description: activity.description,
        time: formatTimeAgo(activity.timestamp)
    }));
}

// Admin Stats
function getAdminStats() {
    const voters = getVoters();
    const votedCount = voters.filter(v => v.voted).length;

    return {
        totalElections: adminStorage.elections.length,
        totalCandidates: adminStorage.candidates.length,
        totalVoters: voters.length,
        totalVotes: adminStorage.results.reduce((sum, r) => sum + (r.votes || 0), 0),
        votedCount: votedCount,
        activeElections: adminStorage.elections.filter(e => e.status === 'Open').length,
        upcomingElections: adminStorage.elections.filter(e => e.status === 'Upcoming').length,
        closedElections: adminStorage.elections.filter(e => e.status === 'Closed').length
    };
}

// Format time ago
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return date.toLocaleDateString();
}

// Format date
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Initialize Sample Data
function initializeAdminData() {
    loadStorage();

    // ✅ FIX: Only skip full init if admin is also set (avoids overwriting a logged-out session)
    if (adminStorage.initialized && adminStorage.elections.length > 0 && adminStorage.admin) return;

    // Set Admin
    setCurrentAdmin({
        email: 'admin@gmail.com',
        password: 'Admin@123',
        name: 'Admin User',
        role: 'Super Admin',
        phone: '+91 9876543210',
        department: 'Administration',
        bio: 'System administrator with over 5 years of experience managing voting systems.',
        location: 'New York, USA',
        createdAt: '2024-01-01'
    });

    // Sample Elections
    const elections = [
        {
            id: 1,
            name: 'General Election 2026',
            areas: 'North, South, East, West',
            status: 'Closed',
            startDate: '2026-01-01T00:00',
            endDate: '2026-01-10T23:59',
            seats: 10,
            type: 'general',
            announced: true,
            multipleVotes: false,
            createdAt: '2025-12-01T10:00:00Z'
        },
        {
            id: 2,
            name: 'Student Council Election',
            areas: 'University Campus',
            status: 'Open',
            startDate: '2026-01-15T00:00',
            endDate: '2026-01-25T23:59',
            seats: 5,
            type: 'general',
            announced: true,
            multipleVotes: false,
            createdAt: '2026-01-01T09:00:00Z'
        },
        {
            id: 3,
            name: 'Local Body Election',
            areas: 'District 1, District 2',
            status: 'Open',
            startDate: '2026-01-18T00:00',
            endDate: '2026-01-28T23:59',
            seats: 8,
            type: 'general',
            announced: true,
            multipleVotes: false,
            createdAt: '2026-01-02T14:30:00Z'
        },
        {
            id: 4,
            name: 'State Assembly Election',
            areas: 'Statewide',
            status: 'Upcoming',
            startDate: '2026-02-01T00:00',
            endDate: '2026-02-10T23:59',
            seats: 15,
            type: 'general',
            announced: false,
            multipleVotes: false,
            createdAt: '2026-01-05T11:15:00Z'
        }
    ];
    elections.forEach(e => addElection(e));

    // Sample Candidates
    const candidates = [
        {
            name: 'John Doe',
            email: 'john@example.com',
            party: 'Democratic Party',
            votes: 1256,
            election: 'General Election 2026',
            phone: '+1 234 567 8901',
            bio: 'Experienced leader with 10 years in public service',
            photo: '',
            symbol: '🐘'
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            party: 'Republican Party',
            votes: 989,
            election: 'General Election 2026',
            phone: '+1 234 567 8902',
            bio: 'Business leader and community advocate',
            photo: '',
            symbol: '🦅'
        },
        {
            name: 'Alice Brown',
            email: 'alice@example.com',
            party: 'Student Unity',
            votes: 645,
            election: 'Student Council Election',
            phone: '+1 234 567 8903',
            bio: 'Student representative for 2 years',
            photo: '',
            symbol: '📚'
        },
        {
            name: 'Bob Wilson',
            email: 'bob@example.com',
            party: 'Campus Forward',
            votes: 587,
            election: 'Student Council Election',
            phone: '+1 234 567 8904',
            bio: 'Former class president',
            photo: '',
            symbol: '🎓'
        },
        {
            name: 'David Lee',
            email: 'david@example.com',
            party: 'Civic Alliance',
            votes: 423,
            election: 'Local Body Election',
            phone: '+1 234 567 8905',
            bio: 'Local business owner',
            photo: '',
            symbol: '🏢'
        },
        {
            name: 'Emma White',
            email: 'emma@example.com',
            party: 'United Front',
            votes: 398,
            election: 'Local Body Election',
            phone: '+1 234 567 8906',
            bio: 'Community organizer',
            photo: '',
            symbol: '🤝'
        }
    ];
    candidates.forEach(c => addCandidate(c));

    // Sample Voters
    const voters = [
        {
            name: 'Krishna Kumar',
            email: 'krishna@gmail.com',
            voterId: 'VOTER00123',
            voted: true,
            votedIn: 'General Election 2026',
            phone: '+91 9876543211',
            constituency: 'North District',
            dob: '1990-05-15',
            canVote: true,
            registeredDate: '2025-12-15'
        },
        {
            name: 'Priya Sharma',
            email: 'priya@gmail.com',
            voterId: 'VOTER00124',
            voted: true,
            votedIn: 'Student Council Election',
            phone: '+91 9876543212',
            constituency: 'University Campus',
            dob: '1995-08-22',
            canVote: true,
            registeredDate: '2025-12-16'
        },
        {
            name: 'Rahul Verma',
            email: 'rahul@gmail.com',
            voterId: 'VOTER00125',
            voted: false,
            votedIn: 'None',
            phone: '+91 9876543213',
            constituency: 'South District',
            dob: '1988-11-30',
            canVote: true,
            registeredDate: '2025-12-17'
        },
        {
            name: 'Anita Patel',
            email: 'anita@gmail.com',
            voterId: 'VOTER00126',
            voted: true,
            votedIn: 'Local Body Election',
            phone: '+91 9876543214',
            constituency: 'East District',
            dob: '1992-03-10',
            canVote: true,
            registeredDate: '2025-12-18'
        },
        {
            name: 'Amit Singh',
            email: 'amit@gmail.com',
            voterId: 'VOTER00127',
            voted: false,
            votedIn: 'None',
            phone: '+91 9876543215',
            constituency: 'West District',
            dob: '1985-07-25',
            canVote: true,
            registeredDate: '2025-12-19'
        },
        {
            name: 'Sneha Reddy',
            email: 'sneha@gmail.com',
            voterId: 'VOTER00128',
            voted: true,
            votedIn: 'General Election 2026',
            phone: '+91 9876543216',
            constituency: 'North District',
            dob: '1993-12-05',
            canVote: true,
            registeredDate: '2025-12-20'
        },
        {
            name: 'Vikram Patel',
            email: 'vikram@gmail.com',
            voterId: 'VOTER00129',
            voted: false,
            votedIn: 'None',
            phone: '+91 9876543217',
            constituency: 'South District',
            dob: '1987-09-18',
            canVote: true,
            registeredDate: '2025-12-21'
        },
        {
            name: 'Neha Gupta',
            email: 'neha@gmail.com',
            voterId: 'VOTER00130',
            voted: true,
            votedIn: 'Student Council Election',
            phone: '+91 9876543218',
            constituency: 'University Campus',
            dob: '1996-04-12',
            canVote: true,
            registeredDate: '2025-12-22'
        }
    ];
    voters.forEach(v => addVoter(v));

    // Sample Results
    adminStorage.results = [
        { electionId: 1, candidate: 'John Doe', party: 'Democratic Party', votes: 1256, election: 'General Election 2026' },
        { electionId: 1, candidate: 'Jane Smith', party: 'Republican Party', votes: 989, election: 'General Election 2026' },
        { electionId: 2, candidate: 'Alice Brown', party: 'Student Unity', votes: 645, election: 'Student Council Election' },
        { electionId: 2, candidate: 'Bob Wilson', party: 'Campus Forward', votes: 587, election: 'Student Council Election' },
        { electionId: 3, candidate: 'David Lee', party: 'Civic Alliance', votes: 423, election: 'Local Body Election' },
        { electionId: 3, candidate: 'Emma White', party: 'United Front', votes: 398, election: 'Local Body Election' }
    ];

    // Sample Notifications
    const notifications = [
        {
            id: 1,
            type: 'info',
            title: 'New Voter Registration',
            message: 'Amit Singh registered as a new voter',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: false
        },
        {
            id: 2,
            type: 'success',
            title: 'Vote Cast',
            message: 'Voter VOTER00123 cast their vote in Student Council Election',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false
        },
        {
            id: 3,
            type: 'warning',
            title: 'Low Participation',
            message: 'Voter turnout is below 50% in Local Body Election',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            read: true
        }
    ];
    notifications.forEach(n => addNotification(n));

    // Sample Activities
    const activities = [
        { type: 'login', description: 'Admin logged in', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { type: 'election', description: 'Election "Student Council Election" updated', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { type: 'candidate', description: 'Candidate "Alice Brown" added', timestamp: new Date(Date.now() - 10800000).toISOString() },
        { type: 'voter', description: 'Voter "Rahul Verma" registered', timestamp: new Date(Date.now() - 14400000).toISOString() }
    ];
    activities.forEach(a => addActivity(a.type, a.description));

    adminStorage.initialized = true;
    saveStorage();
    console.log('✅ Admin data initialized successfully');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminData);
} else {
    initializeAdminData();
}

// Export for debugging
window.adminStorage = adminStorage;