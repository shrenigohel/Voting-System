// Enhanced Storage System for Voter Portal with Login Sync
const voterStorage = {
    voters: [],
    elections: [],
    votes: [],
    notifications: [],
    currentVoter: null,

    // Initialize with sample data
    init: function () {
        this.loadFromLocalStorage();

        if (this.voters.length === 0) {
            this.initWithSampleData();
        }

        console.log('✅ Voter data initialized successfully');
        this.syncWithLoginSystem();
    },

    // Sync with login system storage
    syncWithLoginSystem: function () {
        try {
            if (typeof LocalStorageManager !== 'undefined') {
                console.log('🔄 Syncing with login system storage...');

                const loginVoters = LocalStorageManager.getAllVoters ? LocalStorageManager.getAllVoters() : [];

                loginVoters.forEach(loginVoter => {
                    const existingIndex = this.voters.findIndex(v => v.email === loginVoter.email);

                    if (existingIndex === -1) {
                        const newVoter = {
                            id: loginVoter.id || 'voter_' + Date.now() + Math.random().toString(36).substr(2, 9),
                            email: loginVoter.email,
                            password: loginVoter.password,
                            name: loginVoter.name,
                            phone: loginVoter.phone || '',
                            address: loginVoter.address || '',
                            image: loginVoter.image || '',
                            voterId: loginVoter.voterId || 'VOTER' + Math.floor(10000 + Math.random() * 90000),
                            registrationDate: loginVoter.registeredDate || new Date().toISOString().split('T')[0],
                            verified: true,
                            lastUpdated: null
                        };
                        this.voters.push(newVoter);
                        console.log('➕ Added new voter from login system:', loginVoter.email);
                    } else {
                        const existingVoter = this.voters[existingIndex];

                        if (loginVoter.updatedDate && (!existingVoter.lastUpdated ||
                            new Date(loginVoter.updatedDate) > new Date(existingVoter.lastUpdated))) {
                            this.voters[existingIndex] = {
                                ...existingVoter,
                                name: loginVoter.name || existingVoter.name,
                                password: loginVoter.password || existingVoter.password,
                                phone: loginVoter.phone || existingVoter.phone,
                                address: loginVoter.address || existingVoter.address,
                                lastUpdated: loginVoter.updatedDate
                            };
                            console.log('🔄 Updated voter from login system:', loginVoter.email);
                        }
                    }
                });

                this.saveToLocalStorage();
            }
        } catch (error) {
            console.error('❌ Error syncing with login system:', error);
        }
    },

    // Load data from localStorage
    loadFromLocalStorage: function () {
        try {
            const savedVoters = localStorage.getItem('voterStorage_voters');
            if (savedVoters) {
                this.voters = JSON.parse(savedVoters);
            }

            const savedElections = localStorage.getItem('voterStorage_elections');
            if (savedElections) {
                this.elections = JSON.parse(savedElections);
            } else {
                // Try to load from userData if available
                if (typeof userData !== 'undefined' && userData.elections) {
                    this.elections = userData.elections;
                }
            }

            const savedVotes = localStorage.getItem('voterStorage_votes');
            if (savedVotes) {
                this.votes = JSON.parse(savedVotes);
            } else {
                // Try to load from userData if available
                if (typeof userData !== 'undefined' && userData.userVotes) {
                    this.votes = userData.userVotes;
                }
            }

            const savedNotifications = localStorage.getItem('voterStorage_notifications');
            if (savedNotifications) {
                this.notifications = JSON.parse(savedNotifications);
            }

            console.log('📂 Loaded voter data from localStorage');
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.initWithSampleData();
        }
    },

    // Save all data to localStorage
    saveToLocalStorage: function () {
        try {
            localStorage.setItem('voterStorage_voters', JSON.stringify(this.voters));
            localStorage.setItem('voterStorage_elections', JSON.stringify(this.elections));
            localStorage.setItem('voterStorage_votes', JSON.stringify(this.votes));
            localStorage.setItem('voterStorage_notifications', JSON.stringify(this.notifications));

            console.log('💾 Saved voter data to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    },

    // Initialize with sample data
    initWithSampleData: function () {
        this.voters = [
            {
                id: 'voter_001',
                email: 'krishna@gmail.com',
                password: 'password123',
                name: 'Krishna Kumar',
                phone: '+1 (555) 123-4567',
                address: '123 Main St, City, State 12345',
                image: '',
                voterId: 'VOTER00123',
                registrationDate: 'Dec 15, 2025',
                verified: true,
                lastUpdated: '2025-12-20T10:30:00Z'
            },
            {
                id: 'voter_002',
                email: 'raj@gmail.com',
                password: 'password123',
                name: 'Raj Patel',
                phone: '+1 (555) 987-6543',
                address: '456 Oak Ave, City, State 12345',
                image: '',
                voterId: 'VOTER00456',
                registrationDate: 'Dec 18, 2025',
                verified: true,
                lastUpdated: null
            },
            {
                id: 'voter_003',
                email: 'priya@evoting.com',
                password: 'password123',
                name: 'Priya Singh',
                phone: '+1 (555) 456-7890',
                address: '789 Pine Rd, City, State 12345',
                image: '',
                voterId: 'VOTER00789',
                registrationDate: 'Dec 20, 2025',
                verified: true,
                lastUpdated: null
            }
        ];

        this.elections = [
            {
                id: 1,
                name: "General Election 2026",
                description: "National level general election for all constituencies",
                areas: "North, South, East, West",
                status: "Closed",
                startDate: "Jan 1, 2026",
                endDate: "Jan 10, 2026",
                votingStart: "Jan 1, 2026",
                votingEnd: "Jan 10, 2026",
                totalVoters: 10000,
                votesCast: 8500,
                type: "National",
                candidates: [
                    { id: 1, name: "John Doe", party: "Democratic Party", symbol: "Lotus", votes: 1256 },
                    { id: 2, name: "Jane Smith", party: "Republican Party", symbol: "Elephant", votes: 989 },
                    { id: 3, name: "Robert Johnson", party: "Independent", symbol: "Clock", votes: 734 },
                    { id: 4, name: "Maria Garcia", party: "Green Party", symbol: "Tree", votes: 421 },
                ]
            },
            {
                id: 2,
                name: "Student Council Election 2026",
                description: "Annual student council election for university campus",
                areas: "University Campus",
                status: "Open",
                startDate: "Jan 15, 2026",
                endDate: "Jan 25, 2026",
                votingStart: "Jan 15, 2026",
                votingEnd: "Jan 25, 2026",
                totalVoters: 5000,
                votesCast: 3200,
                type: "Educational",
                candidates: [
                    { id: 5, name: "Alice Brown", party: "Student Unity", symbol: "Book", votes: 145 },
                    { id: 6, name: "Bob Wilson", party: "Campus Forward", symbol: "Torch", votes: 138 },
                    { id: 7, name: "Carol Davis", party: "Progressive Students", symbol: "Star", votes: 152 },
                ]
            },
            {
                id: 3,
                name: "Local Body Election 2026",
                description: "Local municipal corporation elections",
                areas: "District 1, District 2",
                status: "Open",
                startDate: "Jan 18, 2026",
                endDate: "Jan 28, 2026",
                votingStart: "Jan 18, 2026",
                votingEnd: "Jan 28, 2026",
                totalVoters: 15000,
                votesCast: 9200,
                type: "Municipal",
                candidates: [
                    { id: 8, name: "David Lee", party: "Civic Alliance", symbol: "Building", votes: 4200 },
                    { id: 9, name: "Emma White", party: "United Front", symbol: "Hand", votes: 3200 },
                    { id: 10, name: "Frank Miller", party: "People's Choice", symbol: "People", votes: 1800 },
                ]
            },
            {
                id: 4,
                name: "State Assembly Election 2026",
                description: "State legislative assembly elections",
                areas: "Statewide",
                status: "Upcoming",
                startDate: "Feb 1, 2026",
                endDate: "Feb 10, 2026",
                votingStart: "Feb 1, 2026",
                votingEnd: "Feb 10, 2026",
                totalVoters: 50000,
                votesCast: 0,
                type: "State",
                candidates: [
                    { id: 11, name: "George Harris", party: "Democratic Party", symbol: "Lotus", votes: 0 },
                    { id: 12, name: "Helen Clark", party: "Republican Party", symbol: "Elephant", votes: 0 },
                    { id: 13, name: "Ian Thompson", party: "Libertarian Party", symbol: "Eagle", votes: 0 },
                ]
            },
            {
                id: 5,
                name: "Corporate Board Election 2026",
                description: "Annual corporate board member elections",
                areas: "Corporate Headquarters",
                status: "Upcoming",
                startDate: "Feb 15, 2026",
                endDate: "Feb 25, 2026",
                votingStart: "Feb 15, 2026",
                votingEnd: "Feb 25, 2026",
                totalVoters: 2000,
                votesCast: 0,
                type: "Corporate",
                candidates: [
                    { id: 14, name: "James Wilson", party: "Executive Team", symbol: "Briefcase", votes: 0 },
                    { id: 15, name: "Sarah Johnson", party: "Employee Union", symbol: "Handshake", votes: 0 },
                ]
            }
        ];

        this.votes = [
            {
                id: "vote_" + Date.now().toString(36),
                electionId: 1,
                electionName: "General Election 2026",
                candidateId: 1,
                candidate: "John Doe",
                party: "Democratic Party",
                date: "Jan 8, 2026",
                time: "10:30 AM",
                status: "Confirmed",
                userId: "voter_001",
                userEmail: "krishna@gmail.com",
                userName: "Krishna Kumar"
            }
        ];

        this.notifications = [
            {
                id: 1,
                userId: "voter_001",
                userEmail: "krishna@gmail.com",
                title: "Welcome to E-Voting!",
                message: "Welcome Krishna Kumar! Your account is now active.",
                type: "success",
                date: "2026-01-05",
                read: false
            },
            {
                id: 2,
                userId: "voter_001",
                userEmail: "krishna@gmail.com",
                title: "Active Elections",
                message: "Check out active elections and cast your vote.",
                type: "info",
                date: "2026-01-06",
                read: false
            },
            {
                id: 3,
                userId: "voter_001",
                userEmail: "krishna@gmail.com",
                title: "Vote Confirmed",
                message: "Your vote for John Doe in General Election 2026 has been recorded.",
                type: "success",
                date: "2026-01-08",
                read: true
            },
            {
                id: 4,
                userId: "voter_002",
                userEmail: "raj@gmail.com",
                title: "New Election",
                message: "Student Council Election 2026 is now open for voting.",
                type: "info",
                date: "2026-01-15",
                read: false
            }
        ];

        this.saveToLocalStorage();
    }
};

// Initialize data
voterStorage.init();

// Voter Management Functions
function getCurrentVoter() {
    try {
        const sessionUser = sessionStorage.getItem('currentUser');
        const sessionRole = sessionStorage.getItem('currentRole');

        if (sessionUser && sessionRole === 'voter') {
            const sessionVoter = JSON.parse(sessionUser);
            console.log('Found active session voter:', sessionVoter.email);

            let voter = voterStorage.voters.find(v => v.email === sessionVoter.email);

            if (!voter) {
                voter = {
                    id: sessionVoter.id || 'voter_' + Date.now() + Math.random().toString(36).substr(2, 9),
                    email: sessionVoter.email,
                    password: sessionVoter.password,
                    name: sessionVoter.name,
                    phone: sessionVoter.phone || '',
                    address: sessionVoter.address || '',
                    image: sessionVoter.image || '',
                    voterId: sessionVoter.voterId || 'VOTER' + Math.floor(10000 + Math.random() * 90000),
                    registrationDate: sessionVoter.registeredDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                    verified: true,
                    lastUpdated: new Date().toISOString()
                };
                voterStorage.voters.push(voter);
                voterStorage.saveToLocalStorage();
                console.log('Created new voter from session:', voter.email);
            }

            voterStorage.currentVoter = voter;
            return voter;
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }

    if (!voterStorage.currentVoter) {
        const saved = localStorage.getItem('currentVoter');
        if (saved) {
            try {
                voterStorage.currentVoter = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved voter:', e);
            }
        } else if (voterStorage.voters.length > 0) {
            voterStorage.currentVoter = voterStorage.voters[0];
        }
    }

    return voterStorage.currentVoter;
}

function setCurrentVoter(voter) {
    voter.lastUpdated = new Date().toISOString();

    const existingIndex = voterStorage.voters.findIndex(v => v.email === voter.email);
    if (existingIndex > -1) {
        voterStorage.voters[existingIndex] = voter;
    } else {
        if (!voter.id) {
            voter.id = 'voter_' + Date.now() + Math.random().toString(36).substr(2, 9);
        }
        voterStorage.voters.push(voter);
    }

    voterStorage.currentVoter = voter;
    voterStorage.saveToLocalStorage();

    try {
        localStorage.setItem('currentVoter', JSON.stringify(voter));
        sessionStorage.setItem('currentUser', JSON.stringify(voter));
        sessionStorage.setItem('currentRole', 'voter');
    } catch (error) {
        console.error('Error updating sessionStorage:', error);
    }

    syncVoterWithLoginSystem(voter);

    console.log('✅ Voter set and synced:', voter.name);
    return voter;
}

function syncVoterWithLoginSystem(voter) {
    try {
        if (typeof LocalStorageManager !== 'undefined' && LocalStorageManager.getAllVoters) {
            const loginVoters = LocalStorageManager.getAllVoters();
            const loginIndex = loginVoters.findIndex(v => v.email === voter.email);

            if (loginIndex > -1) {
                loginVoters[loginIndex] = {
                    ...loginVoters[loginIndex],
                    name: voter.name,
                    email: voter.email,
                    password: voter.password,
                    phone: voter.phone,
                    address: voter.address,
                    image: voter.image,
                    updatedDate: voter.lastUpdated
                };

                localStorage.setItem('voters', JSON.stringify(loginVoters));
                console.log('🔄 Voter synced with login system:', voter.email);
            } else {
                const newLoginVoter = {
                    id: voter.id || 'voter_' + Date.now(),
                    name: voter.name,
                    email: voter.email,
                    password: voter.password,
                    phone: voter.phone,
                    address: voter.address,
                    image: voter.image,
                    voterId: voter.voterId,
                    registeredDate: voter.registrationDate,
                    updatedDate: voter.lastUpdated,
                    role: 'voter'
                };

                loginVoters.push(newLoginVoter);
                localStorage.setItem('voters', JSON.stringify(loginVoters));
                console.log('➕ Added voter to login system:', voter.email);
            }
        }
    } catch (error) {
        console.error('❌ Error syncing with login system:', error);
    }
}

function getVoters() {
    return voterStorage.voters;
}

function getVoterByEmail(email) {
    return voterStorage.voters.find(v => v.email === email);
}

function saveVoter(voter) {
    voter.lastUpdated = new Date().toISOString();
    const savedVoter = setCurrentVoter(voter);
    syncVoterWithLoginSystem(savedVoter);
    console.log('💾 Voter saved and synced:', savedVoter.name);
    return savedVoter;
}

function logoutVoter() {
    voterStorage.currentVoter = null;
    localStorage.removeItem('currentVoter');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentRole');
    console.log('👋 Voter logged out');
}

// Election Management
function getElections() {
    return voterStorage.elections;
}

function getElectionById(id) {
    return voterStorage.elections.find(e => e.id == id);
}

function getOpenElections() {
    return voterStorage.elections.filter(e => e.status === 'Open');
}

function getUpcomingElections() {
    return voterStorage.elections.filter(e => e.status === 'Upcoming');
}

function getClosedElections() {
    return voterStorage.elections.filter(e => e.status === 'Closed');
}

// Vote Management
function getVoterVotes(userEmail) {
    return voterStorage.votes
        .filter(v => v.userEmail === userEmail)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getVoterVotesCount(userEmail) {
    return voterStorage.votes.filter(v => v.userEmail === userEmail).length;
}

function hasVotedInElection(userEmail, electionId) {
    return voterStorage.votes.some(v => v.userEmail === userEmail && v.electionId == electionId);
}

function saveVote(voteData) {
    try {
        voteData.id = 'vote_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        voterStorage.votes.unshift(voteData);
        voterStorage.saveToLocalStorage();

        // Update election vote count
        const election = voterStorage.elections.find(e => e.id == voteData.electionId);
        if (election) {
            election.votesCast = (election.votesCast || 0) + 1;

            const candidate = election.candidates.find(c => c.id == voteData.candidateId);
            if (candidate) {
                candidate.votes = (candidate.votes || 0) + 1;
            }

            voterStorage.saveToLocalStorage();
        }

        console.log('✓ Vote saved to storage:', voteData);
        return true;
    } catch (error) {
        console.error('Error saving vote:', error);
        return false;
    }
}

// Notification Management
function getVoterNotifications(userEmail) {
    return voterStorage.notifications.filter(n => n.userEmail === userEmail);
}

function getUnreadNotificationCount(userEmail) {
    return voterStorage.notifications.filter(n => n.userEmail === userEmail && !n.read).length;
}

function addNotification(notification) {
    notification.id = Date.now() + Math.floor(Math.random() * 1000);
    notification.read = false;
    voterStorage.notifications.unshift(notification);
    voterStorage.saveToLocalStorage();
    return notification;
}

function markAllNotificationsAsRead(userEmail) {
    voterStorage.notifications.forEach(n => {
        if (n.userEmail === userEmail) {
            n.read = true;
        }
    });
    voterStorage.saveToLocalStorage();
    return true;
}

// Stats
function getVoterStats(userEmail) {
    const votes = getVoterVotes(userEmail);
    const totalElections = voterStorage.elections.length;
    const activeElections = getOpenElections().length;
    const pendingVotes = activeElections - votes.length;

    // Calculate trend percentages (simulated for demo)
    const voteTrend = votes.length > 0 ? 8 : 0;
    const activeTrend = activeElections > 0 ? 24 : 0;

    return {
        totalVotes: votes.length,
        totalElections,
        activeElections,
        pendingVotes: Math.max(0, pendingVotes),
        lastVote: votes.length > 0 ? votes[0].date : null,
        trends: {
            totalVotes: voteTrend,
            activeElections: activeTrend,
            pendingVotes: 0
        }
    };
}

// Authentication
function authenticateVoter(email, password) {
    const voter = getVoterByEmail(email);
    if (voter && voter.password === password) {
        setCurrentVoter(voter);
        return voter;
    }
    return null;
}

function initializeVoterFromLogin(loginData) {
    try {
        let voter = voterStorage.voters.find(v => v.email === loginData.email);

        if (!voter) {
            voter = {
                id: loginData.id || 'voter_' + Date.now() + Math.random().toString(36).substr(2, 9),
                email: loginData.email,
                password: loginData.password,
                name: loginData.name,
                phone: loginData.phone || '',
                address: loginData.address || '',
                image: loginData.image || '',
                voterId: loginData.voterId || 'VOTER' + Math.floor(10000 + Math.random() * 90000),
                registrationDate: loginData.registeredDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                verified: true,
                lastUpdated: new Date().toISOString()
            };

            voterStorage.voters.push(voter);
            voterStorage.saveToLocalStorage();
            console.log('➕ Created new voter from login:', voter.email);
        }

        setCurrentVoter(voter);
        return voter;
    } catch (error) {
        console.error('Error initializing voter from login:', error);
        return null;
    }
}

// Make functions available globally
window.voterStorage = voterStorage;
window.getCurrentVoter = getCurrentVoter;
window.authenticateVoter = authenticateVoter;
window.getElections = getElections;
window.getElectionById = getElectionById;
window.getOpenElections = getOpenElections;
window.getUpcomingElections = getUpcomingElections;
window.getClosedElections = getClosedElections;
window.getVoterVotes = getVoterVotes;
window.getVoterVotesCount = getVoterVotesCount;
window.hasVotedInElection = hasVotedInElection;
window.saveVote = saveVote;
window.getVoterStats = getVoterStats;
window.saveVoter = saveVoter;
window.getVoterByEmail = getVoterByEmail;
window.setCurrentVoter = setCurrentVoter;
window.logoutVoter = logoutVoter;
window.initializeVoterFromLogin = initializeVoterFromLogin;
window.getVoterNotifications = getVoterNotifications;
window.getUnreadNotificationCount = getUnreadNotificationCount;
window.addNotification = addNotification;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;