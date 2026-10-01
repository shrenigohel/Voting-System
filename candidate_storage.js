// Enhanced Storage System for Candidate Portal with Login Sync
const candidateStorage = {
    candidates: [],
    elections: [],
    applications: [],
    votes: [],
    results: [],
    notifications: [],
    currentCandidate: null,

    // Initialize with sample data
    init: function () {
        this.loadFromLocalStorage();

        if (this.candidates.length === 0) {
            this.initWithSampleData();
        }

        console.log('✅ Candidate data initialized successfully');
        this.syncWithLoginSystem();
    },

    // Sync with login system storage
    syncWithLoginSystem: function () {
        try {
            if (typeof LocalStorageManager !== 'undefined') {
                console.log('🔄 Syncing with login system storage...');

                const loginCandidates = LocalStorageManager.getAllCandidates();

                loginCandidates.forEach(loginCandidate => {
                    const existingIndex = this.candidates.findIndex(c => c.email === loginCandidate.email);

                    if (existingIndex === -1) {
                        const newCandidate = {
                            id: 'cand_' + Date.now() + Math.random().toString(36).substr(2, 9),
                            email: loginCandidate.email,
                            password: loginCandidate.password,
                            name: loginCandidate.name,
                            phone: loginCandidate.phone || '',
                            party: loginCandidate.party || 'Independent',
                            bio: loginCandidate.bio || '',
                            image: '',
                            registrationDate: loginCandidate.registeredDate || new Date().toISOString().split('T')[0],
                            verified: true,
                            lastUpdated: null
                        };
                        this.candidates.push(newCandidate);
                        console.log('➕ Added new candidate from login system:', loginCandidate.email);
                    } else {
                        const existingCandidate = this.candidates[existingIndex];

                        // Only update if login data is newer
                        if (loginCandidate.updatedDate && (!existingCandidate.lastUpdated ||
                            new Date(loginCandidate.updatedDate) > new Date(existingCandidate.lastUpdated))) {
                            this.candidates[existingIndex] = {
                                ...existingCandidate,
                                name: loginCandidate.name || existingCandidate.name,
                                password: loginCandidate.password || existingCandidate.password,
                                phone: loginCandidate.phone || existingCandidate.phone,
                                party: loginCandidate.party || existingCandidate.party,
                                bio: loginCandidate.bio || existingCandidate.bio,
                                lastUpdated: loginCandidate.updatedDate
                            };
                            console.log('🔄 Updated candidate from login system:', loginCandidate.email);
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
            const savedCandidates = localStorage.getItem('candidateStorage_candidates');
            if (savedCandidates) {
                this.candidates = JSON.parse(savedCandidates);
            }

            const savedElections = localStorage.getItem('candidateStorage_elections');
            if (savedElections) {
                this.elections = JSON.parse(savedElections);
            }

            const savedApplications = localStorage.getItem('candidateStorage_applications');
            if (savedApplications) {
                this.applications = JSON.parse(savedApplications);
            }

            const savedVotes = localStorage.getItem('candidateStorage_votes');
            if (savedVotes) {
                this.votes = JSON.parse(savedVotes);
            }

            const savedResults = localStorage.getItem('candidateStorage_results');
            if (savedResults) {
                this.results = JSON.parse(savedResults);
            }

            const savedNotifications = localStorage.getItem('candidateStorage_notifications');
            if (savedNotifications) {
                this.notifications = JSON.parse(savedNotifications);
            }

            console.log('📂 Loaded candidate data from localStorage');
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
            this.initWithSampleData();
        }
    },

    // Save all data to localStorage
    saveToLocalStorage: function () {
        try {
            localStorage.setItem('candidateStorage_candidates', JSON.stringify(this.candidates));
            localStorage.setItem('candidateStorage_elections', JSON.stringify(this.elections));
            localStorage.setItem('candidateStorage_applications', JSON.stringify(this.applications));
            localStorage.setItem('candidateStorage_votes', JSON.stringify(this.votes));
            localStorage.setItem('candidateStorage_results', JSON.stringify(this.results));
            localStorage.setItem('candidateStorage_notifications', JSON.stringify(this.notifications));

            console.log('💾 Saved candidate data to localStorage');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    },

    // Initialize with sample data
    initWithSampleData: function () {
        this.candidates = [
            {
                id: 'cand_001',
                email: 'john@evoting.com',
                password: 'candidate123',
                name: 'John Candidate',
                phone: '+1 (555) 123-4567',
                party: 'Independent',
                bio: 'Experienced public servant with 10 years of community leadership. Focused on transparency, education, and economic development.',
                image: '',
                registrationDate: '2025-01-15',
                verified: true,
                lastUpdated: '2025-01-20T10:30:00Z'
            },
            {
                id: 'cand_002',
                email: 'alice@evoting.com',
                password: 'candidate123',
                name: 'Alice Brown',
                phone: '+1 (555) 987-6543',
                party: 'Progressive Party',
                bio: 'Youth activist and environmental advocate with a focus on sustainable development.',
                image: '',
                registrationDate: '2025-02-10',
                verified: true,
                lastUpdated: '2025-02-15T14:20:00Z'
            },
            {
                id: 'cand_003',
                email: 'robert@evoting.com',
                password: 'candidate123',
                name: 'Robert Johnson',
                phone: '+1 (555) 456-7890',
                party: 'Conservative Party',
                bio: 'Business leader focused on economic growth and job creation.',
                image: '',
                registrationDate: '2025-01-05',
                verified: true,
                lastUpdated: '2025-01-10T09:15:00Z'
            }
        ];

        this.elections = [
            {
                id: 1,
                name: 'Student Union President 2026',
                description: 'Annual election for Student Union President',
                areas: 'University Campus',
                status: 'Open',
                startDate: 'Jan 20, 2026',
                endDate: 'Jan 30, 2026',
                votingStart: 'Jan 25, 2026',
                votingEnd: 'Jan 30, 2026',
                maxCandidates: 5,
                candidates: [
                    { id: 'cand_001', name: 'John Candidate', party: 'Independent' }
                ]
            },
            {
                id: 2,
                name: 'City Council District 5',
                description: 'Local government election for District 5',
                areas: 'District 5, City Center',
                status: 'Upcoming',
                startDate: 'Feb 1, 2026',
                endDate: 'Feb 15, 2026',
                votingStart: 'Feb 10, 2026',
                votingEnd: 'Feb 15, 2026',
                maxCandidates: 10,
                candidates: []
            },
            {
                id: 3,
                name: 'Mayoral Race 2026',
                description: 'Citywide mayoral election',
                areas: 'Citywide',
                status: 'Open',
                startDate: 'Jan 15, 2026',
                endDate: 'Jan 25, 2026',
                votingStart: 'Jan 20, 2026',
                votingEnd: 'Jan 25, 2026',
                maxCandidates: 8,
                candidates: [
                    { id: 'cand_001', name: 'John Candidate', party: 'Independent' },
                    { id: 'cand_002', name: 'Alice Brown', party: 'Progressive Party' }
                ]
            },
            {
                id: 4,
                name: 'School Board Election',
                description: 'Election for School Board Members',
                areas: 'District 1, District 2',
                status: 'Upcoming',
                startDate: 'Feb 10, 2026',
                endDate: 'Feb 20, 2026',
                votingStart: 'Feb 15, 2026',
                votingEnd: 'Feb 20, 2026',
                maxCandidates: 12,
                candidates: []
            },
            {
                id: 5,
                name: 'Local Community Board 2025',
                description: 'Community board election held last year',
                areas: 'Local Community Area',
                status: 'Closed',
                startDate: 'Nov 1, 2025',
                endDate: 'Nov 15, 2025',
                votingStart: 'Nov 10, 2025',
                votingEnd: 'Nov 15, 2025',
                maxCandidates: 6,
                candidates: [
                    { id: 'cand_001', name: 'John Candidate', party: 'Independent' }
                ]
            },
            {
                id: 6,
                name: 'State Assembly Primary 2025',
                description: 'Primary election for State Assembly',
                areas: 'State District 10',
                status: 'Closed',
                startDate: 'Aug 1, 2025',
                endDate: 'Aug 15, 2025',
                votingStart: 'Aug 10, 2025',
                votingEnd: 'Aug 15, 2025',
                maxCandidates: 4,
                candidates: [
                    { id: 'cand_001', name: 'John Candidate', party: 'Independent' },
                    { id: 'cand_003', name: 'Robert Johnson', party: 'Conservative Party' }
                ]
            }
        ];

        this.applications = [
            {
                id: 'app_001',
                electionId: 1,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                candidateName: 'John Candidate',
                party: 'Independent',
                reason: 'I want to represent student interests and improve campus facilities.',
                manifesto: 'Focus on improving student housing, mental health services, and campus sustainability.',
                appliedDate: 'Jan 10, 2026',
                reviewedDate: 'Jan 12, 2026',
                status: 'approved',
                notes: 'Candidate meets all requirements'
            },
            {
                id: 'app_002',
                electionId: 3,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                candidateName: 'John Candidate',
                party: 'Independent',
                reason: 'Committed to transparent governance and economic development.',
                manifesto: 'Affordable housing, better public transport, and green initiatives.',
                appliedDate: 'Jan 8, 2026',
                reviewedDate: 'Jan 10, 2026',
                status: 'approved',
                notes: 'Strong community background'
            },
            {
                id: 'app_003',
                electionId: 5,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                candidateName: 'John Candidate',
                party: 'Independent',
                reason: 'Dedicated to community improvement and local development.',
                manifesto: 'Improve local infrastructure and community programs.',
                appliedDate: 'Oct 15, 2025',
                reviewedDate: 'Oct 20, 2025',
                status: 'approved',
                notes: 'Approved for community board'
            },
            {
                id: 'app_004',
                electionId: 6,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                candidateName: 'John Candidate',
                party: 'Independent',
                reason: 'Seeking to represent the district at state level.',
                manifesto: 'Education reform and tax relief for working families.',
                appliedDate: 'Jul 20, 2025',
                reviewedDate: 'Jul 25, 2025',
                status: 'approved',
                notes: 'Qualified candidate'
            },
            {
                id: 'app_005',
                electionId: 2,
                candidateId: 'cand_002',
                candidateEmail: 'alice@evoting.com',
                candidateName: 'Alice Brown',
                party: 'Progressive Party',
                reason: 'Passionate about local government and community engagement.',
                manifesto: 'Environmental sustainability and youth programs.',
                appliedDate: 'Jan 25, 2026',
                reviewedDate: 'Jan 27, 2026',
                status: 'pending',
                notes: 'Under review'
            }
        ];

        this.votes = [
            {
                id: 'vote_001',
                electionId: 1,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                electionName: 'Student Union President 2026',
                votes: 645,
                totalVotes: 1245,
                percentage: 51.8,
                rank: 1
            },
            {
                id: 'vote_002',
                electionId: 3,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                electionName: 'Mayoral Race 2026',
                votes: 387,
                totalVotes: 892,
                percentage: 43.4,
                rank: 2
            }
        ];

        this.results = [
            {
                id: 'res_001',
                electionId: 5,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                electionName: 'Local Community Board 2025',
                votes: 1120,
                totalVotes: 2150,
                percentage: 52.1,
                rank: 1,
                won: true,
                declaredDate: 'Nov 15, 2025'
            },
            {
                id: 'res_002',
                electionId: 6,
                candidateId: 'cand_001',
                candidateEmail: 'john@evoting.com',
                electionName: 'State Assembly Primary 2025',
                votes: 7200,
                totalVotes: 18500,
                percentage: 38.9,
                rank: 2,
                won: false,
                declaredDate: 'Aug 30, 2025'
            }
        ];

        this.notifications = [
            {
                id: 1,
                candidateEmail: 'john@evoting.com',
                title: "Application Approved",
                message: "Your application for Student Union President has been approved!",
                type: "success",
                date: "2026-01-12",
                read: false
            },
            {
                id: 2,
                candidateEmail: 'john@evoting.com',
                title: "New Election",
                message: "A new election 'City Council District 5' is now open for applications.",
                type: "info",
                date: "2026-01-10",
                read: false
            },
            {
                id: 3,
                candidateEmail: 'john@evoting.com',
                title: "Campaign Reminder",
                message: "Your campaign for Mayoral Race ends in 3 days. Keep engaging with voters!",
                type: "warning",
                date: "2026-01-08",
                read: true
            },
            {
                id: 4,
                candidateEmail: 'alice@evoting.com',
                title: "Application Submitted",
                message: "Your application for City Council District 5 has been submitted.",
                type: "info",
                date: "2026-01-25",
                read: false
            }
        ];

        this.saveToLocalStorage();
    }
};

// Initialize data
candidateStorage.init();

// Candidate Management Functions
function getCurrentCandidate() {
    try {
        const sessionUser = sessionStorage.getItem('currentUser');
        const sessionRole = sessionStorage.getItem('currentRole');

        if (sessionUser && sessionRole === 'candidate') {
            const sessionCandidate = JSON.parse(sessionUser);
            console.log('Found active session candidate:', sessionCandidate.email);

            let candidate = candidateStorage.candidates.find(c => c.email === sessionCandidate.email);

            if (!candidate) {
                candidate = {
                    id: 'cand_' + Date.now() + Math.random().toString(36).substr(2, 9),
                    email: sessionCandidate.email,
                    password: sessionCandidate.password,
                    name: sessionCandidate.name,
                    phone: sessionCandidate.phone || '',
                    party: sessionCandidate.party || 'Independent',
                    bio: sessionCandidate.bio || '',
                    image: sessionCandidate.image || '',
                    registrationDate: sessionCandidate.registeredDate || new Date().toISOString().split('T')[0],
                    verified: true,
                    lastUpdated: new Date().toISOString()
                };
                candidateStorage.candidates.push(candidate);
                candidateStorage.saveToLocalStorage();
                console.log('Created new candidate from session:', candidate.email);
            }

            candidateStorage.currentCandidate = candidate;
            return candidate;
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }

    if (!candidateStorage.currentCandidate) {
        const saved = localStorage.getItem('currentCandidate');
        if (saved) {
            try {
                candidateStorage.currentCandidate = JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing saved candidate:', e);
            }
        } else if (candidateStorage.candidates.length > 0) {
            candidateStorage.currentCandidate = candidateStorage.candidates[0];
        }
    }

    return candidateStorage.currentCandidate;
}

function setCurrentCandidate(candidate) {
    candidate.lastUpdated = new Date().toISOString();

    const existingIndex = candidateStorage.candidates.findIndex(c => c.email === candidate.email);
    if (existingIndex > -1) {
        candidateStorage.candidates[existingIndex] = candidate;
    } else {
        if (!candidate.id) {
            candidate.id = 'cand_' + Date.now() + Math.random().toString(36).substr(2, 9);
        }
        candidateStorage.candidates.push(candidate);
    }

    candidateStorage.currentCandidate = candidate;
    candidateStorage.saveToLocalStorage();

    try {
        localStorage.setItem('currentCandidate', JSON.stringify(candidate));
        sessionStorage.setItem('currentUser', JSON.stringify(candidate));
        sessionStorage.setItem('currentRole', 'candidate');
    } catch (error) {
        console.error('Error updating sessionStorage:', error);
    }

    syncCandidateWithLoginSystem(candidate);

    console.log('✅ Candidate set and synced:', candidate.name);
    return candidate;
}

function syncCandidateWithLoginSystem(candidate) {
    try {
        if (typeof LocalStorageManager !== 'undefined' && LocalStorageManager.getAllCandidates) {
            const loginCandidates = LocalStorageManager.getAllCandidates();
            const loginIndex = loginCandidates.findIndex(c => c.email === candidate.email);

            if (loginIndex > -1) {
                loginCandidates[loginIndex] = {
                    ...loginCandidates[loginIndex],
                    name: candidate.name,
                    email: candidate.email,
                    password: candidate.password,
                    phone: candidate.phone,
                    party: candidate.party,
                    bio: candidate.bio,
                    image: candidate.image,
                    updatedDate: candidate.lastUpdated
                };

                localStorage.setItem('candidates', JSON.stringify(loginCandidates));
                console.log('🔄 Candidate synced with login system:', candidate.email);
            } else {
                const newLoginCandidate = {
                    id: candidate.id || 'cand_' + Date.now(),
                    name: candidate.name,
                    email: candidate.email,
                    password: candidate.password,
                    phone: candidate.phone,
                    party: candidate.party,
                    bio: candidate.bio,
                    image: candidate.image,
                    registeredDate: candidate.registrationDate,
                    updatedDate: candidate.lastUpdated,
                    role: 'candidate'
                };

                loginCandidates.push(newLoginCandidate);
                localStorage.setItem('candidates', JSON.stringify(loginCandidates));
                console.log('➕ Added candidate to login system:', candidate.email);
            }
        }
    } catch (error) {
        console.error('❌ Error syncing with login system:', error);
    }
}

function getCandidates() {
    return candidateStorage.candidates;
}

function getCandidateByEmail(email) {
    return candidateStorage.candidates.find(c => c.email === email);
}

function saveCandidate(candidate) {
    candidate.lastUpdated = new Date().toISOString();
    const savedCandidate = setCurrentCandidate(candidate);
    syncCandidateWithLoginSystem(savedCandidate);
    console.log('💾 Candidate saved and synced:', savedCandidate.name);
    return savedCandidate;
}

function logoutCandidate() {
    candidateStorage.currentCandidate = null;
    localStorage.removeItem('currentCandidate');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentRole');
    console.log('👋 Candidate logged out');
}

// Election Management
function getElections() {
    return candidateStorage.elections;
}

function getElectionById(id) {
    return candidateStorage.elections.find(e => e.id == id);
}

function getOpenElections() {
    return candidateStorage.elections.filter(e => e.status === 'Open');
}

function getUpcomingElections() {
    return candidateStorage.elections.filter(e => e.status === 'Upcoming');
}

function getClosedElections() {
    return candidateStorage.elections.filter(e => e.status === 'Closed');
}

// Application Management
function getCandidateApplications(candidateEmail) {
    return candidateStorage.applications
        .filter(a => a.candidateEmail === candidateEmail)
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
}

function getPendingApplications(candidateEmail) {
    return candidateStorage.applications.filter(a =>
        a.candidateEmail === candidateEmail && a.status === 'pending'
    );
}

function getApprovedApplications(candidateEmail) {
    return candidateStorage.applications.filter(a =>
        a.candidateEmail === candidateEmail && a.status === 'approved'
    );
}

function saveCandidateApplication(application) {
    const existing = candidateStorage.applications.find(a =>
        a.electionId === application.electionId &&
        a.candidateEmail === application.candidateEmail
    );

    if (existing) {
        return false;
    }

    application.id = 'app_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    candidateStorage.applications.push(application);
    candidateStorage.saveToLocalStorage();

    return true;
}

function hasAppliedForElection(candidateEmail, electionId) {
    return candidateStorage.applications.some(a =>
        a.candidateEmail === candidateEmail && a.electionId == electionId
    );
}

// Vote Management
function getCandidateVotes(candidateEmail) {
    return candidateStorage.votes.filter(v => v.candidateEmail === candidateEmail);
}

function getTotalVotesForCandidate(candidateEmail) {
    const votes = getCandidateVotes(candidateEmail);
    return votes.reduce((sum, v) => sum + (v.votes || 0), 0);
}

// Results Management
function getCandidateResults(candidateEmail) {
    return candidateStorage.results.filter(r => r.candidateEmail === candidateEmail);
}

function getWonElections(candidateEmail) {
    return candidateStorage.results.filter(r => r.candidateEmail === candidateEmail && r.won);
}

// Notification Management
function getCandidateNotifications(candidateEmail) {
    return candidateStorage.notifications.filter(n => n.candidateEmail === candidateEmail);
}

function getUnreadNotificationCount(candidateEmail) {
    return candidateStorage.notifications.filter(n =>
        n.candidateEmail === candidateEmail && !n.read
    ).length;
}

function addNotification(notification) {
    notification.id = Date.now() + Math.floor(Math.random() * 1000);
    notification.read = false;
    candidateStorage.notifications.unshift(notification);
    candidateStorage.saveToLocalStorage();
    return notification;
}

function markAllNotificationsAsRead(candidateEmail) {
    candidateStorage.notifications.forEach(n => {
        if (n.candidateEmail === candidateEmail) {
            n.read = true;
        }
    });
    candidateStorage.saveToLocalStorage();
    return true;
}

// Stats
function getCandidateStats(candidateEmail) {
    const applications = getCandidateApplications(candidateEmail);
    const votes = getCandidateVotes(candidateEmail);
    const results = getCandidateResults(candidateEmail);

    const activeElections = applications.filter(a => a.status === 'approved').length;
    const totalVotes = votes.reduce((sum, v) => sum + v.votes, 0);
    const wonElections = results.filter(r => r.won).length;

    // Calculate trend percentages (simulated for demo)
    const voteTrend = totalVotes > 0 ? 24 : 0;
    const applicationTrend = applications.length > 0 ? 8 : 0;
    const activeTrend = activeElections > 0 ? 12 : 0;

    return {
        activeElections,
        applications: applications.length,
        totalVotes,
        wonElections,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        votePercentage: votes.length > 0 ?
            votes.reduce((sum, v) => sum + v.percentage, 0) / votes.length : 0,
        trends: {
            activeElections: activeTrend,
            applications: applicationTrend,
            totalVotes: voteTrend,
            wonElections: 0
        }
    };
}

// Authentication
function authenticateCandidate(email, password) {
    const candidate = getCandidateByEmail(email);
    if (candidate && candidate.password === password) {
        setCurrentCandidate(candidate);
        return candidate;
    }
    return null;
}

function initializeCandidateFromLogin(loginData) {
    try {
        let candidate = candidateStorage.candidates.find(c => c.email === loginData.email);

        if (!candidate) {
            candidate = {
                id: 'cand_' + Date.now() + Math.random().toString(36).substr(2, 9),
                email: loginData.email,
                password: loginData.password,
                name: loginData.name,
                phone: loginData.phone || '',
                party: loginData.party || 'Independent',
                bio: loginData.bio || '',
                image: loginData.image || '',
                registrationDate: loginData.registeredDate || new Date().toISOString().split('T')[0],
                verified: true,
                lastUpdated: new Date().toISOString()
            };

            candidateStorage.candidates.push(candidate);
            candidateStorage.saveToLocalStorage();
            console.log('➕ Created new candidate from login:', candidate.email);
        }

        setCurrentCandidate(candidate);
        return candidate;
    } catch (error) {
        console.error('Error initializing candidate from login:', error);
        return null;
    }
}

// Make functions available globally
window.candidateStorage = candidateStorage;
window.getCurrentCandidate = getCurrentCandidate;
window.authenticateCandidate = authenticateCandidate;
window.getElections = getElections;
window.getElectionById = getElectionById;
window.getOpenElections = getOpenElections;
window.getUpcomingElections = getUpcomingElections;
window.getClosedElections = getClosedElections;
window.getCandidateApplications = getCandidateApplications;
window.getPendingApplications = getPendingApplications;
window.getApprovedApplications = getApprovedApplications;
window.saveCandidateApplication = saveCandidateApplication;
window.hasAppliedForElection = hasAppliedForElection;
window.getCandidateVotes = getCandidateVotes;
window.getTotalVotesForCandidate = getTotalVotesForCandidate;
window.getCandidateResults = getCandidateResults;
window.getWonElections = getWonElections;
window.getCandidateStats = getCandidateStats;
window.saveCandidate = saveCandidate;
window.getCandidateByEmail = getCandidateByEmail;
window.setCurrentCandidate = setCurrentCandidate;
window.logoutCandidate = logoutCandidate;
window.initializeCandidateFromLogin = initializeCandidateFromLogin;
window.getCandidateNotifications = getCandidateNotifications;
window.getUnreadNotificationCount = getUnreadNotificationCount;
window.addNotification = addNotification;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;