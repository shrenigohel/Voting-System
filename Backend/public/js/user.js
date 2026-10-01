// Global variables
let currentVoteSelection = null;
let notifications = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
});

// Initialize app
function initializeApp() {
    console.log('🚀 Initializing Voter Dashboard...');

    checkAndLoadLoginData();
    showDashboard();
    updateVoterInfo();
    loadDashboard();
    updateNotificationBadge();

    setTimeout(() => {
        const voter = getCurrentVoter();
        if (voter) {
            showToast(`Welcome ${voter.name} to your Voter Dashboard`, "success");
        }
    }, 500);
}

// Check and load login data
function checkAndLoadLoginData() {
    try {
        const sessionUser = sessionStorage.getItem('currentUser');
        const sessionRole = sessionStorage.getItem('currentRole');

        if (sessionUser && sessionRole === 'voter') {
            console.log('Loading voter from session...');
            const loginData = JSON.parse(sessionUser);

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
                console.log('Created voter from session:', voter.email);
            }

            setCurrentVoter(voter);
            console.log('✅ Voter loaded from session:', voter.name);
            return true;
        }

        const tempVoter = sessionStorage.getItem('tempRegisteredVoter');
        if (tempVoter) {
            console.log('Found newly registered voter');
            const newVoter = JSON.parse(tempVoter);
            sessionStorage.removeItem('tempRegisteredVoter');
            saveVoter(newVoter);
            showToast(`Welcome ${newVoter.name}! Your voter dashboard is ready.`, "success");
            return true;
        }

        console.log('No login data found, using default voter');
        return false;
    } catch (error) {
        console.error('Error checking login data:', error);
        return false;
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('dashboardScreen').style.display = 'block';
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    // Status filter - Updated to match candidate dashboard
    const electionFilter = document.getElementById('electionStatusFilter');
    if (electionFilter) {
        electionFilter.addEventListener('change', filterElections);
    }

    // Vote election select
    const voteElectionSelect = document.getElementById('voteElectionSelect');
    if (voteElectionSelect) {
        voteElectionSelect.addEventListener('change', handleElectionSelect);
    }

    // Password input listeners
    document.getElementById("newPassword")?.addEventListener("input", function () {
        updatePasswordStrength(this.value);
        checkPasswordMatch();
    });

    document.getElementById("confirmPassword")?.addEventListener("input", checkPasswordMatch);
    document.getElementById("currentPassword")?.addEventListener("input", validateChangePasswordForm);

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        const profileMenu = document.querySelector('.nav-profile');
        const dropdown = document.getElementById('profileDropdown');

        if (profileMenu && dropdown && !profileMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }

        if (e.target.classList.contains('modal-backdrop')) {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('show');
            });
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const toggleBtn = document.querySelector('.mobile-menu-toggle i');

    navMenu.classList.toggle('mobile-show');

    if (navMenu.classList.contains('mobile-show')) {
        toggleBtn.className = 'fas fa-times';
    } else {
        toggleBtn.className = 'fas fa-bars';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function (e) {
    const navMenu = document.getElementById('navMenu');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');

    if (navMenu && toggleBtn && !navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        navMenu.classList.remove('mobile-show');
        const toggleIcon = document.querySelector('.mobile-menu-toggle i');
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-bars';
        }
    }
});

// Update voter info
function updateVoterInfo() {
    const voter = getCurrentVoter();
    if (!voter) return;

    const firstName = voter.name.split(' ')[0];

    document.getElementById('userName').textContent = voter.name;
    document.getElementById('profileName').textContent = voter.name;
    document.getElementById('profileEmail').textContent = voter.email;
    document.getElementById('welcomeName').textContent = firstName;

    const profileStatus = document.getElementById('profileStatus');
    if (profileStatus) {
        if (voter.lastUpdated) {
            const lastUpdated = new Date(voter.lastUpdated);
            const now = new Date();
            const daysDiff = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                profileStatus.textContent = 'Updated today';
                profileStatus.className = 'profile-status updated';
            } else if (daysDiff === 1) {
                profileStatus.textContent = 'Updated yesterday';
                profileStatus.className = 'profile-status updated';
            } else if (daysDiff < 7) {
                profileStatus.textContent = `Updated ${daysDiff} days ago`;
                profileStatus.className = 'profile-status updated';
            } else {
                profileStatus.textContent = `Last updated: ${lastUpdated.toLocaleDateString()}`;
                profileStatus.className = 'profile-status';
            }
        } else {
            profileStatus.textContent = 'Profile not updated yet';
            profileStatus.className = 'profile-status';
        }
    }

    const welcomeInfo = document.getElementById('profileWelcomeInfo');
    if (welcomeInfo && voter.voterId) {
        welcomeInfo.textContent = `Voter ID: ${voter.voterId} | Registered: ${voter.registrationDate}`;
    }

    const initials = voter.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    document.getElementById('avatarInitials').textContent = initials;
    document.getElementById('avatarInitialsLarge').textContent = initials;

    if (voter.image) {
        const avatar = document.getElementById('avatarInitials');
        const avatarLarge = document.getElementById('avatarInitialsLarge');
        avatar.style.backgroundImage = `url('${voter.image}')`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
        avatar.style.color = 'transparent';

        avatarLarge.style.backgroundImage = `url('${voter.image}')`;
        avatarLarge.style.backgroundSize = 'cover';
        avatarLarge.style.backgroundPosition = 'center';
        avatarLarge.style.color = 'transparent';
    }
}

// Update notification badge
function updateNotificationBadge() {
    const voter = getCurrentVoter();
    if (!voter) return;

    const unreadCount = getUnreadNotificationCount(voter.email);
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// Toggle notifications
function toggleNotifications() {
    const voter = getCurrentVoter();
    if (!voter) return;

    const notifications = getVoterNotifications(voter.email);
    const unreadNotifications = notifications.filter(n => !n.read);

    if (unreadNotifications.length > 0) {
        markAllNotificationsAsRead(voter.email);
        updateNotificationBadge();
        showToast('All notifications marked as read!', 'success');
    } else {
        showToast('No new notifications', 'info');
    }
}

// Toggle profile dropdown
function toggleProfile() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('show');
}

// Navigate to page
function navigateTo(page) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === page) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    const targetId = page === 'dashboard' ? 'dashboardPage' :
        page === 'elections' ? 'electionsPage' :
            page === 'cast-vote' ? 'castVotePage' :
                page === 'results' ? 'resultsPage' :
                    page === 'voting-history' ? 'votingHistoryPage' : '';

    const targetPage = document.getElementById(targetId);
    if (targetPage) {
        targetPage.classList.add('active');
        loadPageData(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('mobile-show')) {
        navMenu.classList.remove('mobile-show');
        const toggleIcon = document.querySelector('.mobile-menu-toggle i');
        if (toggleIcon) {
            toggleIcon.className = 'fas fa-bars';
        }
    }
}

// Load page data
function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'elections':
            loadElectionsPage();
            break;
        case 'cast-vote':
            loadCastVotePage();
            break;
        case 'results':
            loadResultsPage();
            break;
        case 'voting-history':
            loadVotingHistoryPage();
            break;
    }
}

// Load dashboard with enhanced stats
function loadDashboard() {
    const voter = getCurrentVoter();
    if (!voter) return;

    const stats = getVoterStats(voter.email);

    // Update main stats
    document.getElementById('totalElections').textContent = stats.totalElections;
    document.getElementById('votesCast').textContent = stats.totalVotes;
    document.getElementById('activeElections').textContent = stats.activeElections;

    // Update pending votes stat
    const pendingVotesStat = document.getElementById('pendingVotesStat');
    if (pendingVotesStat) {
        pendingVotesStat.textContent = stats.pendingVotes;
    }

    // Update hero stats
    document.getElementById('votedCount').textContent = stats.totalVotes;
    document.getElementById('pendingCount').textContent = stats.pendingVotes;

    // Update trend percentages
    document.getElementById('totalTrend').textContent = stats.trends.activeElections;
    document.getElementById('votesTrend').textContent = stats.trends.totalVotes;
    document.getElementById('activeTrend').textContent = stats.trends.activeElections;
    document.getElementById('pendingTrend').textContent = stats.trends.pendingVotes;

    // Update trend icons based on values
    updateTrendIcons(stats.trends);

    // Update voter info
    if (document.getElementById('voterIdHome')) {
        document.getElementById('voterIdHome').textContent = voter.voterId || 'Not assigned';
    }
    if (document.getElementById('emailHome')) {
        document.getElementById('emailHome').textContent = voter.email;
    }
    if (document.getElementById('memberSinceHome')) {
        document.getElementById('memberSinceHome').textContent = voter.registrationDate || 'Recent';
    }
    if (document.getElementById('lastVoteHome')) {
        document.getElementById('lastVoteHome').textContent = stats.lastVote || 'Not voted yet';
    }

    loadActiveElections();
    loadActivityTimeline();
}

// Update trend icons based on values
function updateTrendIcons(trends) {
    const trendElements = document.querySelectorAll('.stat-trend i');

    trendElements.forEach((icon, index) => {
        const parent = icon.parentElement;
        const trendSpan = parent.querySelector('span');
        if (!trendSpan) return;

        const trendValue = parseFloat(trendSpan.textContent);

        if (trendValue > 0) {
            icon.className = 'fas fa-arrow-up';
            parent.classList.add('up');
            parent.classList.remove('down');
        } else if (trendValue < 0) {
            icon.className = 'fas fa-arrow-down';
            parent.classList.add('down');
            parent.classList.remove('up');
        } else {
            icon.className = 'fas fa-minus';
            parent.classList.remove('up', 'down');
        }
    });
}

// Load active elections
function loadActiveElections() {
    const activeElections = getOpenElections();
    const container = document.getElementById('activeElectionsList');
    const voter = getCurrentVoter();

    if (!container) return;

    if (activeElections.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Active Elections</h3>
                <p>Check back later for upcoming elections.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    activeElections.slice(0, 3).forEach(election => {
        const hasVoted = hasVotedInElection(voter.email, election.id);

        const item = document.createElement('div');
        item.className = 'election-item';
        item.innerHTML = `
            <div class="election-header">
                <h3>${election.name}</h3>
                <span class="badge success">Open</span>
            </div>
            <div style="display: flex; gap: 1.5rem; color: var(--gray-600); font-size: 0.9rem; margin-bottom: 1rem;">
                <span><i class="fas fa-map-marker-alt"></i> ${election.areas}</span>
                <span><i class="fas fa-calendar"></i> Ends: ${election.endDate}</span>
            </div>
            ${hasVoted
                ? '<button class="btn-secondary" disabled><i class="fas fa-check-circle"></i> Already Voted</button>'
                : `<button class="btn-primary" onclick="quickVote(${election.id})"><i class="fas fa-vote-yea"></i> Vote Now</button>`
            }
        `;
        container.appendChild(item);
    });
}

// Load activity timeline
function loadActivityTimeline() {
    const container = document.getElementById('activityTimeline');
    const voter = getCurrentVoter();
    const votes = getVoterVotes(voter.email);

    let activities = [];

    votes.forEach(vote => {
        activities.push({
            icon: 'vote-yea',
            title: `Voted in ${vote.electionName}`,
            description: `Voted for ${vote.candidate} (${vote.party})`,
            time: `${vote.date} at ${vote.time}`
        });
    });

    if (voter.lastUpdated) {
        const lastUpdated = new Date(voter.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            activities.unshift({
                icon: 'user-edit',
                title: 'Profile Updated',
                description: 'Your profile information was updated',
                time: hoursDiff < 1 ? 'Just now' : `${Math.floor(hoursDiff)} hours ago`
            });
        }
    }

    activities.unshift({
        icon: 'sign-in-alt',
        title: 'Logged In',
        description: 'Successfully accessed the voting portal',
        time: 'Just now'
    });

    if (activities.length === 1) {
        activities.push({
            icon: 'info-circle',
            title: 'Profile Setup Complete',
            description: 'Your voter profile has been created',
            time: voter.registrationDate || 'Recently'
        });
    }

    container.innerHTML = '';
    activities.slice(0, 5).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        `;
        container.appendChild(item);
    });
}

// Load elections page - Updated to match candidate dashboard
function loadElectionsPage() {
    const elections = getElections();
    displayElections(elections);
}

// Filter elections - Updated to match candidate dashboard
function filterElections() {
    const filterValue = document.getElementById('electionStatusFilter').value;
    const elections = getElections();

    if (filterValue === 'all') {
        displayElections(elections);
    } else {
        const filtered = elections.filter(e => e.status === filterValue);
        displayElections(filtered);
    }
}

// Display elections - Updated to match candidate dashboard design
function displayElections(elections) {
    const container = document.getElementById('electionsGrid');
    const voter = getCurrentVoter();

    if (elections.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Elections Available</h3>
                <p>Check back later for upcoming elections</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    elections.forEach(election => {
        const hasVoted = hasVotedInElection(voter.email, election.id);

        const badgeClass = election.status === 'Open' ? 'success' :
            election.status === 'Upcoming' ? 'warning' : 'danger';

        const card = document.createElement('div');
        card.className = 'election-card';
        card.innerHTML = `
            <div class="election-header">
                <h3>${election.name}</h3>
                <span class="badge ${badgeClass}">${election.status}</span>
            </div>
            <div class="election-meta">
                <div><i class="fas fa-calendar"></i> ${election.startDate} - ${election.endDate}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${election.areas}</div>
                <div><i class="fas fa-users"></i> ${election.candidates.length} Candidates</div>
            </div>
            ${election.status === 'Open'
                ? hasVoted
                    ? '<button class="btn-secondary" disabled><i class="fas fa-check-circle"></i> Already Voted</button>'
                    : `<button class="btn-primary" onclick="quickVote(${election.id})"><i class="fas fa-vote-yea"></i> Vote Now</button>`
                : election.status === 'Upcoming'
                    ? '<button class="btn-secondary" disabled><i class="fas fa-clock"></i> Coming Soon</button>'
                    : `<button class="btn-secondary" onclick="viewElectionResults(${election.id})"><i class="fas fa-chart-bar"></i> View Results</button>`
            }
        `;
        container.appendChild(card);
    });
}

// Load cast vote page
function loadCastVotePage() {
    const elections = getOpenElections();
    const select = document.getElementById('voteElectionSelect');

    if (!select) return;

    select.innerHTML = '<option value="">Choose an election</option>';

    elections.forEach(election => {
        const option = document.createElement('option');
        option.value = election.id;
        option.textContent = election.name;
        select.appendChild(option);
    });

    const candidatesSection = document.getElementById('candidatesSection');
    if (candidatesSection) {
        candidatesSection.style.display = 'none';
    }
}

// Handle election select
function handleElectionSelect() {
    const electionId = parseInt(document.getElementById('voteElectionSelect').value);
    const section = document.getElementById('candidatesSection');
    const container = document.getElementById('candidatesGrid');
    const voter = getCurrentVoter();

    if (!section || !container) return;

    if (!electionId) {
        section.style.display = 'none';
        return;
    }

    const hasVoted = hasVotedInElection(voter.email, electionId);

    if (hasVoted) {
        section.style.display = 'block';
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle" style="color: var(--success); font-size: 2.5rem;"></i>
                <p style="color: var(--success); font-weight: 600;">You have already voted in this election!</p>
                <p>You cannot vote again in the same election.</p>
                <button class="btn-primary" onclick="navigateTo('voting-history')">
                    <i class="fas fa-history"></i> View Voting History
                </button>
            </div>
        `;
        return;
    }

    const election = getElectionById(electionId);
    if (!election || !election.candidates || election.candidates.length === 0) {
        section.style.display = 'block';
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <p>No candidates available for this election</p>
            </div>
        `;
        return;
    }

    section.style.display = 'block';
    container.innerHTML = '';

    election.candidates.forEach(candidate => {
        const initials = candidate.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2);

        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <div class="candidate-avatar">${initials}</div>
            <h4>${candidate.name}</h4>
            <p class="candidate-party"><i class="fas fa-flag"></i> ${candidate.party}</p>
            <button class="btn-primary" onclick="selectCandidate(${electionId}, ${candidate.id}, '${candidate.name.replace(/'/g, "\\'")}', '${candidate.party.replace(/'/g, "\\'")}')">
                <i class="fas fa-vote-yea"></i> Vote for ${candidate.name.split(' ')[0]}
            </button>
        `;
        container.appendChild(card);
    });
}

// Select candidate
function selectCandidate(electionId, candidateId, candidateName, party) {
    currentVoteSelection = {
        electionId: electionId,
        candidateId: candidateId,
        candidate: candidateName,
        party: party
    };

    const election = getElectionById(electionId);
    const message = `You are about to vote for <strong>${candidateName}</strong> from <strong>${party}</strong> in the <strong>${election.name}</strong>.`;

    document.getElementById('voteMessage').innerHTML = message;
    document.getElementById('voteModal').classList.add('show');
}

// Confirm vote
function confirmVote() {
    if (!currentVoteSelection) return;

    const voter = getCurrentVoter();
    const election = getElectionById(currentVoteSelection.electionId);

    const newVote = {
        electionId: currentVoteSelection.electionId,
        electionName: election.name,
        candidateId: currentVoteSelection.candidateId,
        candidate: currentVoteSelection.candidate,
        party: currentVoteSelection.party,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Confirmed',
        userId: voter.id,
        userEmail: voter.email,
        userName: voter.name
    };

    if (saveVote(newVote)) {
        addNotification({
            userEmail: voter.email,
            userId: voter.id,
            title: "Vote Confirmed",
            message: `Your vote for ${currentVoteSelection.candidate} in ${election.name} has been recorded.`,
            type: "success",
            date: new Date().toISOString().split('T')[0],
            read: false
        });

        updateNotificationBadge();
        showToast(`Vote successfully cast for ${currentVoteSelection.candidate}!`, 'success');
        closeVoteModal();

        loadCastVotePage();
        loadDashboard();

        currentVoteSelection = null;
    }
}

// Quick vote
function quickVote(electionId) {
    navigateTo('cast-vote');
    setTimeout(() => {
        const selectElement = document.getElementById('voteElectionSelect');
        if (selectElement) {
            selectElement.value = electionId;
            handleElectionSelect();
        }
    }, 100);
}

// View election results
function viewElectionResults(electionId) {
    navigateTo('results');
}

// Load results page
function loadResultsPage() {
    const allResults = [];
    getElections().forEach(election => {
        election.candidates.forEach(candidate => {
            allResults.push({
                candidate: candidate.name,
                party: candidate.party,
                votes: candidate.votes || 0,
                electionName: election.name
            });
        });
    });

    const totalVotes = allResults.reduce((sum, r) => sum + r.votes, 0);
    const sortedResults = [...allResults].sort((a, b) => b.votes - a.votes);
    const leader = sortedResults[0];

    const summaryContainer = document.getElementById('resultsSummary');
    const chartContainer = document.getElementById('resultsChart');

    if (!summaryContainer || !chartContainer) return;

    if (totalVotes === 0) {
        summaryContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <h3>No Results Available</h3>
                <p>Results will appear after elections close.</p>
            </div>
        `;
        chartContainer.innerHTML = '';
        return;
    }

    summaryContainer.innerHTML = `
        <div class="result-box">
            <h3>${totalVotes.toLocaleString()}</h3>
            <p>Total Votes</p>
        </div>
        <div class="result-box">
            <h3>${allResults.length}</h3>
            <p>Candidates</p>
        </div>
        <div class="result-box">
            <h3>${leader?.candidate?.split(' ')[0] || 'None'}</h3>
            <p>Currently Leading</p>
        </div>
    `;

    chartContainer.innerHTML = '<h3 style="margin-bottom: 1.5rem;">Vote Distribution</h3>';

    sortedResults.slice(0, 10).forEach(result => {
        const percentage = totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : 0;
        const div = document.createElement('div');
        div.className = 'result-bar-wrapper';
        div.innerHTML = `
            <div class="result-bar-header">
                <span><strong>${result.candidate}</strong> - ${result.party}</span>
                <span>${result.votes.toLocaleString()} votes (${percentage}%)</span>
            </div>
            <div class="result-bar">
                <div class="result-fill" style="width: ${percentage}%">${percentage}%</div>
            </div>
        `;
        chartContainer.appendChild(div);
    });
}

// Load voting history page
function loadVotingHistoryPage() {
    const container = document.getElementById('historyList');
    const voter = getCurrentVoter();
    const votes = getVoterVotes(voter.email);

    if (!container) return;

    if (votes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No Voting History</h3>
                <p>Participate in active elections to see your history here.</p>
                <button class="btn-primary mt-3" onclick="navigateTo('cast-vote')">
                    <i class="fas fa-vote-yea"></i> Cast Your First Vote
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    votes.forEach(vote => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-header">
                <h4><i class="fas fa-vote-yea"></i> ${vote.electionName}</h4>
                <span class="history-date">${vote.date} at ${vote.time}</span>
            </div>
            <div class="history-details">
                <div><strong>Candidate:</strong> ${vote.candidate}</div>
                <div><strong>Party:</strong> ${vote.party}</div>
                <div><strong>Status:</strong> <span class="badge success">Confirmed</span></div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Password strength functions
function checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return Math.min(strength, 4);
}

function updatePasswordStrength(password) {
    const strength = checkPasswordStrength(password);
    const container = document.getElementById("passwordStrengthContainer");
    const text = document.getElementById("passwordStrengthText");
    const segments = document.querySelectorAll(".strength-segment");

    if (password.length === 0) {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";

    segments.forEach(segment => {
        const segmentStrength = parseInt(segment.getAttribute("data-strength"));
        if (segmentStrength <= strength) {
            segment.classList.add("active");
        } else {
            segment.classList.remove("active");
        }
    });

    const strengthTexts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    text.textContent = strengthTexts[strength];
}

function checkPasswordMatch() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const matchDiv = document.getElementById("passwordMatch");
    const mismatchDiv = document.getElementById("passwordMismatch");
    const saveBtn = document.getElementById("savePasswordBtn");

    if (confirmPassword.length === 0) {
        matchDiv.style.display = "none";
        mismatchDiv.style.display = "none";
        return;
    }

    if (newPassword === confirmPassword) {
        matchDiv.style.display = "flex";
        mismatchDiv.style.display = "none";
    } else {
        matchDiv.style.display = "none";
        mismatchDiv.style.display = "flex";
    }

    validateChangePasswordForm();
}

function validateChangePasswordForm() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const saveBtn = document.getElementById("savePasswordBtn");

    const isValid =
        currentPassword.length > 0 &&
        newPassword.length >= 8 &&
        confirmPassword === newPassword;

    saveBtn.disabled = !isValid;
}

// Open change password modal
function openChangePasswordModal() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    document.getElementById("passwordStrengthContainer").style.display = "none";
    document.getElementById("passwordMatch").style.display = "none";
    document.getElementById("passwordMismatch").style.display = "none";
    document.getElementById("savePasswordBtn").disabled = true;

    document.getElementById('changePasswordModal').classList.add('show');
    toggleProfile();
}

// Close change password modal
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('show');
}

// Save password (change password)
function savePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    const candidate = getCurrentCandidate();
    if (!candidate) {
        showToast("Error: Candidate data not found", "error");
        return;
    }

    if (currentPassword !== candidate.password) {
        showToast("Current password is incorrect!", "error");
        return;
    }

    if (currentPassword === newPassword) {
        showToast("New password must be different from current password!", "error");
        return;
    }

    candidate.password = newPassword;
    saveCandidate(candidate);

    closeChangePasswordModal();
    showToast("Password changed successfully! You will be logged out in 3 seconds...", "success");

    setTimeout(() => {
        if (confirm("Password changed successfully! Please login again with your new password.")) {
            logoutCandidate();
            window.location.href = 'login.html';
        }
    }, 3000);
}


// Open edit profile modal
function openEditProfileModal() {
    const voter = getCurrentVoter();
    if (!voter) return;

    document.getElementById('editName').value = voter.name || '';
    document.getElementById('editEmail').value = voter.email || '';
    document.getElementById('editPhone').value = voter.phone || '';
    document.getElementById('editAddress').value = voter.address || '';
    document.getElementById('editImage').value = voter.image || '';

    document.getElementById('editProfileModal').classList.add('show');
    toggleProfile();
}

// Close edit profile modal
function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('show');
}

// Save profile
function saveProfile() {
    const voter = getCurrentVoter();
    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();
    const newAddress = document.getElementById('editAddress').value.trim();
    const newImage = document.getElementById('editImage').value.trim();

    if (!newName || !newEmail) {
        showToast('Name and Email are required!', 'error');
        return;
    }

    if (newEmail !== voter.email) {
        const existingVoter = getVoterByEmail(newEmail);
        if (existingVoter && existingVoter.email !== voter.email) {
            showToast('This email is already registered', 'error');
            return;
        }
    }

    voter.name = newName;
    voter.email = newEmail;
    voter.phone = newPhone;
    voter.address = newAddress;
    if (newImage) {
        voter.image = newImage;
    }

    saveVoter(voter);
    updateVoterInfo();
    closeEditProfileModal();

    const updateStatus = document.getElementById('profileUpdateStatus');
    if (updateStatus) {
        updateStatus.style.display = 'flex';
        setTimeout(() => {
            updateStatus.style.display = 'none';
        }, 3000);
    }

    showToast('Profile updated successfully!', 'success');
    loadDashboard();
}

// Open change password modal
function openChangePasswordModal() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    document.getElementById("passwordStrengthContainer").style.display = "none";
    document.getElementById("passwordMatch").style.display = "none";
    document.getElementById("passwordMismatch").style.display = "none";
    document.getElementById("savePasswordBtn").disabled = true;

    document.getElementById('changePasswordModal').classList.add('show');
    toggleProfile();
}

// Close change password modal
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('show');
}

// Save password (change password)
function savePassword() {
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    const voter = getCurrentVoter();
    if (!voter) {
        showToast("Error: Voter data not found", "error");
        return;
    }

    if (currentPassword !== voter.password) {
        showToast("Current password is incorrect!", "error");
        return;
    }

    if (currentPassword === newPassword) {
        showToast("New password must be different from current password!", "error");
        return;
    }

    voter.password = newPassword;
    saveVoter(voter);

    closeChangePasswordModal();
    showToast("Password changed successfully! You will be logged out in 3 seconds...", "success");

    setTimeout(() => {
        if (confirm("Password changed successfully! Please login again with your new password.")) {
            handleLogout();
        }
    }, 3000);
}

// Close vote modal
function closeVoteModal() {
    document.getElementById('voteModal').classList.remove('show');
    currentVoteSelection = null;
}

// Show Confirmation Modal
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');

    if (titleEl) titleEl.innerHTML = '<i class="fas fa-sign-out-alt"></i> ' + title;
    if (messageEl) messageEl.textContent = message;

    window.confirmAction = function () {
        onConfirm();
        closeModal('confirmModal');
    };

    if (modal) modal.classList.add('show');
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Handle logout
function handleLogout() {
    showConfirmModal(
        'Logout',
        'Are you sure you want to logout?',
        () => {
            logoutVoter();
            showToast('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    );
}

// Show toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    const messageSpan = document.getElementById('toastMessage');

    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            toast.classList.add('success');
            toast.classList.remove('error');
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            toast.classList.add('error');
            toast.classList.remove('success');
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            toast.classList.add('error');
            toast.classList.remove('success');
            break;
        case 'info':
            icon.className = 'fas fa-info-circle';
            toast.classList.add('success');
            toast.classList.remove('error');
            break;
        default:
            icon.className = 'fas fa-info-circle';
    }

    messageSpan.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Make functions globally available
window.toggleMobileMenu = toggleMobileMenu;
window.navigateTo = navigateTo;
window.toggleNotifications = toggleNotifications;
window.toggleProfile = toggleProfile;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.saveProfile = saveProfile;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.savePassword = savePassword;
window.quickVote = quickVote;
window.selectCandidate = selectCandidate;
window.confirmVote = confirmVote;
window.closeVoteModal = closeVoteModal;
window.viewElectionResults = viewElectionResults;
window.filterElections = filterElections;
window.handleLogout = handleLogout;
window.closeModal = closeModal;
window.showConfirmModal = showConfirmModal;