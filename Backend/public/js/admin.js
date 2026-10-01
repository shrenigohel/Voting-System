// Global Variables
let currentEditingElection = null;
let currentEditingCandidate = null;
let currentEditingVoter = null;
let currentPage = 'dashboard';
let searchTimeout = null;
let charts = {};
let electionPage = 1;
let candidatePage = 1;
let voterPage = 1;
let itemsPerPage = 10;

// Initialize on Load
document.addEventListener('DOMContentLoaded', function () {
    // Small delay to ensure DOM is fully loaded
    setTimeout(() => {
        initializeApp();
        setupEventListeners();
        loadDashboard();
        initKeyboardShortcuts();
        initCharts();
    }, 100);
});

// Initialize App
function initializeApp() {
    // Load storage first
    if (typeof loadStorage === 'function') {
        loadStorage();
    }

    const admin = getCurrentAdmin();
    if (!admin) {
        showToast('Please login as admin', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    updateAdminInfo();
    updateNotificationBadge();
    loadSystemSettings();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    // Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    const sidebarClose = document.getElementById('sidebarClose');
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Profile Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.dataset.tab;
            switchProfileTab(tab);
        });
    });

    // Settings Navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', function () {
            const setting = this.dataset.setting;
            switchSettingsTab(setting);
        });
    });

    // Password Strength Check
    const newPassword = document.getElementById('newPassword');
    if (newPassword) {
        newPassword.addEventListener('input', checkPasswordStrength);
    }

    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => performSearch(this.value), 300);
        });
    }

    // Notifications
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Election Search
    const electionSearch = document.getElementById('electionSearch');
    if (electionSearch) {
        electionSearch.addEventListener('input', debounce(filterElections, 300));
    }

    // Candidate Search
    const candidateSearch = document.getElementById('candidateSearch');
    if (candidateSearch) {
        candidateSearch.addEventListener('input', debounce(filterCandidates, 300));
    }

    // Voter Search
    const voterSearch = document.getElementById('voterSearch');
    if (voterSearch) {
        voterSearch.addEventListener('input', debounce(filterVoters, 300));
    }

    // File Upload
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');

    if (dropArea && fileInput) {
        dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = 'var(--primary)';
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = 'var(--border-color)';
        });
        dropArea.addEventListener('drop', handleFileDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Voter File Upload
    const voterDropArea = document.getElementById('voterDropArea');
    const voterFileInput = document.getElementById('voterFileInput');

    if (voterDropArea && voterFileInput) {
        voterDropArea.addEventListener('click', () => voterFileInput.click());
        voterDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            voterDropArea.style.borderColor = 'var(--primary)';
        });
        voterDropArea.addEventListener('dragleave', () => {
            voterDropArea.style.borderColor = 'var(--border-color)';
        });
        voterDropArea.addEventListener('drop', handleVoterFileDrop);
        voterFileInput.addEventListener('change', handleVoterFileSelect);
    }

    // Close panels when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.notifications-panel') && !e.target.closest('.notification-btn')) {
            const panel = document.getElementById('notificationsPanel');
            if (panel) panel.classList.remove('show');
        }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Election status filter
    const electionStatusFilter = document.getElementById('electionStatusFilter');
    if (electionStatusFilter) {
        electionStatusFilter.addEventListener('change', filterElections);
    }

    // Candidate filters
    const candidateElectionFilter = document.getElementById('candidateElectionFilter');
    if (candidateElectionFilter) {
        candidateElectionFilter.addEventListener('change', filterCandidates);
    }

    const candidatePartyFilter = document.getElementById('candidatePartyFilter');
    if (candidatePartyFilter) {
        candidatePartyFilter.addEventListener('change', filterCandidates);
    }

    // Voter status filter
    const voterStatusFilter = document.getElementById('voterStatusFilter');
    if (voterStatusFilter) {
        voterStatusFilter.addEventListener('change', filterVoters);
    }

    // Result election select
    const resultElectionSelect = document.getElementById('resultElectionSelect');
    if (resultElectionSelect) {
        resultElectionSelect.addEventListener('change', loadResultsForElection);
    }

    // Select all voters
    const selectAllVoters = document.getElementById('selectAllVoters');
    if (selectAllVoters) {
        selectAllVoters.addEventListener('change', toggleAllVoters);
    }
}

// Initialize Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput')?.focus();
        }

        if (e.key === 'Escape') {
            closeAllModals();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (currentPage === 'elections') {
                openElectionModal();
            }
        }
    });
}

// Initialize Charts
function initCharts() {
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            createParticipationChart();
        }
    }, 500);
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        if (document.body.classList.contains('light-theme')) {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
    showToast('Theme updated', 'success');
}

// Update Admin Info
function updateAdminInfo() {
    const admin = getCurrentAdmin();
    if (!admin) return;

    const initials = getInitials(admin.name);

    const sidebarName = document.getElementById('sidebarName');
    if (sidebarName) sidebarName.textContent = admin.name;

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) sidebarAvatar.innerHTML = `<span>${initials}</span>`;

    const mobileAvatar = document.getElementById('mobileAvatar');
    if (mobileAvatar) mobileAvatar.textContent = initials;

    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) welcomeName.textContent = admin.name.split(' ')[0];

    const profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = admin.name;

    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = admin.email;

    const profilePhone = document.getElementById('profilePhone');
    if (profilePhone) profilePhone.textContent = admin.phone || '+91 9876543210';

    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.textContent = initials;

    const profileFullName = document.getElementById('profileFullName');
    if (profileFullName) profileFullName.value = admin.name;

    const profileEmailInput = document.getElementById('profileEmailInput');
    if (profileEmailInput) profileEmailInput.value = admin.email;

    const profilePhoneInput = document.getElementById('profilePhoneInput');
    if (profilePhoneInput) profilePhoneInput.value = admin.phone || '+91 9876543210';

    const profileDepartment = document.getElementById('profileDepartment');
    if (profileDepartment) profileDepartment.value = admin.department || 'admin';

    const profileBio = document.getElementById('profileBio');
    if (profileBio) profileBio.value = admin.bio || '';

    const profileLocation = document.getElementById('profileLocation');
    if (profileLocation) profileLocation.value = admin.location || '';
}

// Get Initials
function getInitials(name) {
    if (!name) return 'AD';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

// Navigate to Page
function navigateTo(page) {
    currentPage = page;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });

    const targetPage = document.getElementById(page + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');

        const titles = {
            'dashboard': 'Dashboard',
            'elections': 'Elections',
            'candidates': 'Candidates',
            'voters': 'Voters',
            'results': 'Results',
            'profile': 'Profile',
            'settings': 'Settings'
        };

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = titles[page];

        const pageBreadcrumb = document.getElementById('pageBreadcrumb');
        if (pageBreadcrumb) pageBreadcrumb.textContent = `Home / ${titles[page]}`;

        loadPageData(page);
    }

    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}

// Load Page Data
function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'elections':
            loadElections();
            break;
        case 'candidates':
            loadCandidates();
            break;
        case 'voters':
            loadVoters();
            break;
        case 'results':
            loadResultsPage();
            break;
        case 'profile':
            loadProfileSettings();
            break;
        case 'settings':
            loadSettingsPage();
            break;
    }
}

// Load Dashboard
function loadDashboard() {
    const stats = getAdminStats();

    const totalElections = document.getElementById('totalElections');
    if (totalElections) totalElections.textContent = stats.totalElections;

    const totalCandidates = document.getElementById('totalCandidates');
    if (totalCandidates) totalCandidates.textContent = stats.totalCandidates;

    const totalVoters = document.getElementById('totalVoters');
    if (totalVoters) totalVoters.textContent = stats.totalVoters;

    const totalVotes = document.getElementById('totalVotes');
    if (totalVotes) totalVotes.textContent = stats.totalVotes;

    const votedCount = stats.votedCount;
    const notVotedCount = stats.totalVoters - votedCount;
    const percentage = stats.totalVoters > 0 ? Math.round((votedCount / stats.totalVoters) * 100) : 0;

    const votedCountEl = document.getElementById('votedCount');
    if (votedCountEl) votedCountEl.textContent = votedCount;

    const notVotedCountEl = document.getElementById('notVotedCount');
    if (notVotedCountEl) notVotedCountEl.textContent = notVotedCount;

    const totalVotersCount = document.getElementById('totalVotersCount');
    if (totalVotersCount) totalVotersCount.textContent = stats.totalVoters;

    const participationPercentage = document.getElementById('participationPercentage');
    if (participationPercentage) participationPercentage.textContent = percentage + '%';

    const circle = document.getElementById('participationProgress');
    if (circle) {
        const degrees = (percentage * 360) / 100;
        circle.style.background = `conic-gradient(var(--primary) ${degrees}deg, var(--border-color) ${degrees}deg)`;
    }

    updateStatCharts();
    loadActiveElections();
    loadRecentActivity();
    loadUpcomingElections();
}

// Update Stat Charts
function updateStatCharts() {
    const stats = getAdminStats();

    const electionChart = document.getElementById('electionChart');
    if (electionChart) {
        electionChart.innerHTML = createSparkline([20, 25, 30, 35, 40, 45, 50]);
    }

    const candidateChart = document.getElementById('candidateChart');
    if (candidateChart) {
        candidateChart.innerHTML = createSparkline([15, 20, 25, 30, 35, 40, 45]);
    }

    const voterChart = document.getElementById('voterChart');
    if (voterChart) {
        voterChart.innerHTML = createSparkline([10, 20, 30, 40, 50, 60, 70]);
    }

    const voteChart = document.getElementById('voteChart');
    if (voteChart) {
        voteChart.innerHTML = createSparkline([5, 15, 25, 35, 45, 55, 65]);
    }
}

// Create Sparkline
function createSparkline(data) {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const height = 50;
    const width = 100;
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    return `<svg width="100" height="50" viewBox="0 0 100 50">
        <polyline points="${points}" fill="none" stroke="var(--primary)" stroke-width="2"/>
    </svg>`;
}

// Load Active Elections
function loadActiveElections() {
    const elections = getElections().filter(e => e.status === 'Open');
    const container = document.getElementById('activeElectionsList');

    if (!container) return;

    if (elections.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No active elections</p></div>';
        return;
    }

    container.innerHTML = '';
    elections.slice(0, 3).forEach(election => {
        const item = document.createElement('div');
        item.className = 'election-item';
        item.onclick = () => navigateTo('elections');
        item.innerHTML = `
            <div class="election-item-header">
                <h4>${escapeHtml(election.name)}</h4>
                <span class="status-badge active">Active</span>
            </div>
            <div class="election-item-meta">
                <span><i class="fas fa-calendar"></i> Ends: ${formatDate(election.endDate)}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(election.areas)}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// Load Upcoming Elections
function loadUpcomingElections() {
    const elections = getElections().filter(e => e.status === 'Upcoming');
    const container = document.getElementById('upcomingElectionsList');

    if (!container) return;

    if (elections.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><p>No upcoming elections</p></div>';
        return;
    }

    container.innerHTML = '';
    elections.slice(0, 3).forEach(election => {
        const startDate = new Date(election.startDate);
        const item = document.createElement('div');
        item.className = 'upcoming-item';
        item.innerHTML = `
            <div class="upcoming-date">
                <div class="day">${startDate.getDate()}</div>
                <div class="month">${startDate.toLocaleString('default', { month: 'short' })}</div>
            </div>
            <div class="upcoming-info">
                <h4>${escapeHtml(election.name)}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(election.areas)}</p>
            </div>
            <span class="upcoming-badge">${election.seats || 1} Seats</span>
        `;
        container.appendChild(item);
    });
}

// Load Recent Activity
function loadRecentActivity() {
    const container = document.getElementById('recentActivityList');
    if (!container) return;

    const activities = getRecentActivities();

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>';
        return;
    }

    container.innerHTML = '';
    activities.slice(0, 5).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon"><i class="fas fa-${activity.icon}"></i></div>
            <div class="activity-content">
                <h4>${escapeHtml(activity.title)}</h4>
                <p>${escapeHtml(activity.description)}</p>
            </div>
            <div class="activity-time">${escapeHtml(activity.time)}</div>
        `;
        container.appendChild(item);
    });
}

// Load Elections
function loadElections() {
    const elections = getElections();
    const tbody = document.getElementById('electionsTableBody');

    if (!tbody) return;

    const totalElections = document.getElementById('electionTotal');
    if (totalElections) totalElections.textContent = elections.length;

    const start = (electionPage - 1) * itemsPerPage + 1;
    const end = Math.min(electionPage * itemsPerPage, elections.length);

    const electionStart = document.getElementById('electionStart');
    if (electionStart) electionStart.textContent = elections.length > 0 ? start : 0;

    const electionEnd = document.getElementById('electionEnd');
    if (electionEnd) electionEnd.textContent = end;

    const currentElectionPage = document.getElementById('currentElectionPage');
    if (currentElectionPage) currentElectionPage.textContent = electionPage;

    const prevBtn = document.getElementById('prevElectionPage');
    const nextBtn = document.getElementById('nextElectionPage');

    if (prevBtn) prevBtn.disabled = electionPage === 1;
    if (nextBtn) nextBtn.disabled = end >= elections.length;

    if (elections.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No elections found</td></tr>';
        return;
    }

    const paginatedElections = elections.slice((electionPage - 1) * itemsPerPage, electionPage * itemsPerPage);

    tbody.innerHTML = '';
    paginatedElections.forEach((election) => {
        const statusClass = election.status === 'Open' ? 'active' :
            election.status === 'Upcoming' ? 'upcoming' : 'closed';

        const progress = calculateElectionProgress(election);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(election.name)}</td>
            <td>${formatDate(election.startDate)}</td>
            <td>${formatDate(election.endDate)}</td>
            <td>${escapeHtml(election.areas)}</td>
            <td>${escapeHtml(election.seats || 1)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(election.status)}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editElection(${election.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteElection(${election.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateElectionDropdown();
    updateResultElectionDropdown();
}

// Calculate Election Progress
function calculateElectionProgress(election) {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
}

// Filter Elections
function filterElections() {
    const statusFilter = document.getElementById('electionStatusFilter')?.value || 'all';
    const searchTerm = document.getElementById('electionSearch')?.value.toLowerCase() || '';

    const elections = getElections();
    const filtered = elections.filter(election => {
        if (statusFilter !== 'all' && election.status !== statusFilter) return false;
        if (searchTerm && !election.name.toLowerCase().includes(searchTerm) &&
            !election.areas.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    const tbody = document.getElementById('electionsTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No elections match your filters</td></tr>';
        return;
    }

    electionPage = 1;

    tbody.innerHTML = '';
    filtered.slice(0, itemsPerPage).forEach(election => {
        const statusClass = election.status === 'Open' ? 'active' :
            election.status === 'Upcoming' ? 'upcoming' : 'closed';

        const progress = calculateElectionProgress(election);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(election.name)}</td>
            <td>${formatDate(election.startDate)}</td>
            <td>${formatDate(election.endDate)}</td>
            <td>${escapeHtml(election.areas)}</td>
            <td>${escapeHtml(election.seats || 1)}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(election.status)}</span></td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editElection(${election.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteElection(${election.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const totalElections = document.getElementById('electionTotal');
    if (totalElections) totalElections.textContent = filtered.length;

    const electionStart = document.getElementById('electionStart');
    if (electionStart) electionStart.textContent = filtered.length > 0 ? 1 : 0;

    const electionEnd = document.getElementById('electionEnd');
    if (electionEnd) electionEnd.textContent = Math.min(itemsPerPage, filtered.length);

    const currentElectionPage = document.getElementById('currentElectionPage');
    if (currentElectionPage) currentElectionPage.textContent = 1;

    const prevBtn = document.getElementById('prevElectionPage');
    const nextBtn = document.getElementById('nextElectionPage');

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = filtered.length <= itemsPerPage;
}

// Load Candidates
function loadCandidates() {
    const candidates = getCandidates();
    const container = document.getElementById('candidatesGrid');

    if (!container) return;

    const totalCandidates = document.getElementById('candidateTotal');
    if (totalCandidates) totalCandidates.textContent = candidates.length;

    const start = (candidatePage - 1) * 12 + 1;
    const end = Math.min(candidatePage * 12, candidates.length);

    const candidateStart = document.getElementById('candidateStart');
    if (candidateStart) candidateStart.textContent = candidates.length > 0 ? start : 0;

    const candidateEnd = document.getElementById('candidateEnd');
    if (candidateEnd) candidateEnd.textContent = end;

    const currentCandidatePage = document.getElementById('currentCandidatePage');
    if (currentCandidatePage) currentCandidatePage.textContent = candidatePage;

    const prevBtn = document.getElementById('prevCandidatePage');
    const nextBtn = document.getElementById('nextCandidatePage');

    if (prevBtn) prevBtn.disabled = candidatePage === 1;
    if (nextBtn) nextBtn.disabled = end >= candidates.length;

    if (candidates.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No candidates found</p></div>';
        return;
    }

    const paginatedCandidates = candidates.slice((candidatePage - 1) * 12, candidatePage * 12);

    container.innerHTML = '';
    paginatedCandidates.forEach(candidate => {
        const initials = getInitials(candidate.name);
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <div class="candidate-header">
                <div class="candidate-avatar">${initials}</div>
                <div class="candidate-info">
                    <h4>${escapeHtml(candidate.name)}</h4>
                    <span class="candidate-party"><i class="fas fa-flag"></i> ${escapeHtml(candidate.party)}</span>
                </div>
            </div>
            <div class="candidate-stats">
                <div class="candidate-stat">
                    <span class="value">${candidate.votes || 0}</span>
                    <span class="label">Votes</span>
                </div>
                <div class="candidate-stat">
                    <span class="value">1</span>
                    <span class="label">Election</span>
                </div>
            </div>
            <div class="candidate-footer">
                <button class="btn-icon edit" onclick="editCandidate('${candidate.email}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteCandidate('${candidate.email}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });

    updateCandidateFilters();
}

// Update Candidate Filters
function updateCandidateFilters() {
    const candidates = getCandidates();
    const electionFilter = document.getElementById('candidateElectionFilter');
    const partyFilter = document.getElementById('candidatePartyFilter');

    if (electionFilter) {
        const elections = [...new Set(candidates.map(c => c.election).filter(e => e))];
        electionFilter.innerHTML = '<option value="all">All Elections</option>';
        elections.forEach(election => {
            if (election) {
                electionFilter.innerHTML += `<option value="${election}">${escapeHtml(election)}</option>`;
            }
        });
    }

    if (partyFilter) {
        const parties = [...new Set(candidates.map(c => c.party).filter(p => p))];
        partyFilter.innerHTML = '<option value="all">All Parties</option>';
        parties.forEach(party => {
            if (party) {
                partyFilter.innerHTML += `<option value="${party}">${escapeHtml(party)}</option>`;
            }
        });
    }
}

// Filter Candidates
function filterCandidates() {
    const electionFilter = document.getElementById('candidateElectionFilter')?.value || 'all';
    const partyFilter = document.getElementById('candidatePartyFilter')?.value || 'all';
    const searchTerm = document.getElementById('candidateSearch')?.value.toLowerCase() || '';

    const candidates = getCandidates();
    const filtered = candidates.filter(candidate => {
        if (electionFilter !== 'all' && candidate.election !== electionFilter) return false;
        if (partyFilter !== 'all' && candidate.party !== partyFilter) return false;
        if (searchTerm && !candidate.name.toLowerCase().includes(searchTerm) &&
            !candidate.email.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    const container = document.getElementById('candidatesGrid');
    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No candidates match your filters</p></div>';
        return;
    }

    candidatePage = 1;

    container.innerHTML = '';
    filtered.slice(0, 12).forEach(candidate => {
        const initials = getInitials(candidate.name);
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <div class="candidate-header">
                <div class="candidate-avatar">${initials}</div>
                <div class="candidate-info">
                    <h4>${escapeHtml(candidate.name)}</h4>
                    <span class="candidate-party"><i class="fas fa-flag"></i> ${escapeHtml(candidate.party)}</span>
                </div>
            </div>
            <div class="candidate-stats">
                <div class="candidate-stat">
                    <span class="value">${candidate.votes || 0}</span>
                    <span class="label">Votes</span>
                </div>
                <div class="candidate-stat">
                    <span class="value">1</span>
                    <span class="label">Election</span>
                </div>
            </div>
            <div class="candidate-footer">
                <button class="btn-icon edit" onclick="editCandidate('${candidate.email}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteCandidate('${candidate.email}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(card);
    });

    const totalCandidates = document.getElementById('candidateTotal');
    if (totalCandidates) totalCandidates.textContent = filtered.length;

    const candidateStart = document.getElementById('candidateStart');
    if (candidateStart) candidateStart.textContent = filtered.length > 0 ? 1 : 0;

    const candidateEnd = document.getElementById('candidateEnd');
    if (candidateEnd) candidateEnd.textContent = Math.min(12, filtered.length);

    const currentCandidatePage = document.getElementById('currentCandidatePage');
    if (currentCandidatePage) currentCandidatePage.textContent = 1;

    const prevBtn = document.getElementById('prevCandidatePage');
    const nextBtn = document.getElementById('nextCandidatePage');

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = filtered.length <= 12;
}

// Load Voters
function loadVoters() {
    const voters = getVoters();
    const tbody = document.getElementById('votersTableBody');

    if (!tbody) return;

    const totalVoters = document.getElementById('voterTotal');
    if (totalVoters) totalVoters.textContent = voters.length;

    const start = (voterPage - 1) * itemsPerPage + 1;
    const end = Math.min(voterPage * itemsPerPage, voters.length);

    const voterStart = document.getElementById('voterStart');
    if (voterStart) voterStart.textContent = voters.length > 0 ? start : 0;

    const voterEnd = document.getElementById('voterEnd');
    if (voterEnd) voterEnd.textContent = end;

    const currentVoterPage = document.getElementById('currentVoterPage');
    if (currentVoterPage) currentVoterPage.textContent = voterPage;

    const prevBtn = document.getElementById('prevVoterPage');
    const nextBtn = document.getElementById('nextVoterPage');

    if (prevBtn) prevBtn.disabled = voterPage === 1;
    if (nextBtn) nextBtn.disabled = end >= voters.length;

    if (voters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No voters found</td></tr>';
        return;
    }

    const paginatedVoters = voters.slice((voterPage - 1) * itemsPerPage, voterPage * itemsPerPage);

    tbody.innerHTML = '';
    paginatedVoters.forEach(voter => {
        const statusClass = voter.voted ? 'active' : 'upcoming';
        const statusText = voter.voted ? 'Voted' : 'Not Voted';
        const votedIn = voter.votedIn || 'None';
        const registeredDate = voter.registeredDate || formatDate(new Date());

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="voter-checkbox" value="${voter.voterId}" onchange="updateVoterSelection()"></td>
            <td>${escapeHtml(voter.name)}</td>
            <td>${escapeHtml(voter.email)}</td>
            <td>${escapeHtml(voter.voterId)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${escapeHtml(votedIn)}</td>
            <td>${registeredDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editVoter('${voter.voterId}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteVoter('${voter.voterId}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Voters
function filterVoters() {
    const statusFilter = document.getElementById('voterStatusFilter')?.value || 'all';
    const searchTerm = document.getElementById('voterSearch')?.value.toLowerCase() || '';

    const voters = getVoters();
    const filtered = voters.filter(voter => {
        if (statusFilter === 'voted' && !voter.voted) return false;
        if (statusFilter === 'not-voted' && voter.voted) return false;
        if (searchTerm && !voter.name.toLowerCase().includes(searchTerm) &&
            !voter.email.toLowerCase().includes(searchTerm) &&
            !voter.voterId.toLowerCase().includes(searchTerm)) return false;
        return true;
    });

    const tbody = document.getElementById('votersTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No voters match your filters</td></tr>';
        return;
    }

    voterPage = 1;

    tbody.innerHTML = '';
    filtered.slice(0, itemsPerPage).forEach(voter => {
        const statusClass = voter.voted ? 'active' : 'upcoming';
        const statusText = voter.voted ? 'Voted' : 'Not Voted';
        const votedIn = voter.votedIn || 'None';
        const registeredDate = voter.registeredDate || formatDate(new Date());

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="voter-checkbox" value="${voter.voterId}" onchange="updateVoterSelection()"></td>
            <td>${escapeHtml(voter.name)}</td>
            <td>${escapeHtml(voter.email)}</td>
            <td>${escapeHtml(voter.voterId)}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${escapeHtml(votedIn)}</td>
            <td>${registeredDate}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit" onclick="editVoter('${voter.voterId}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteVoter('${voter.voterId}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const totalVoters = document.getElementById('voterTotal');
    if (totalVoters) totalVoters.textContent = filtered.length;

    const voterStart = document.getElementById('voterStart');
    if (voterStart) voterStart.textContent = filtered.length > 0 ? 1 : 0;

    const voterEnd = document.getElementById('voterEnd');
    if (voterEnd) voterEnd.textContent = Math.min(itemsPerPage, filtered.length);

    const currentVoterPage = document.getElementById('currentVoterPage');
    if (currentVoterPage) currentVoterPage.textContent = 1;

    const prevBtn = document.getElementById('prevVoterPage');
    const nextBtn = document.getElementById('nextVoterPage');

    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = filtered.length <= itemsPerPage;
}

// Toggle All Voters
function toggleAllVoters() {
    const selectAll = document.getElementById('selectAllVoters');
    const checkboxes = document.querySelectorAll('.voter-checkbox');

    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// Update Voter Selection
function updateVoterSelection() {
    const checkboxes = document.querySelectorAll('.voter-checkbox');
    const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

    const selectAll = document.getElementById('selectAllVoters');
    if (selectAll && checkboxes.length > 0) {
        selectAll.checked = Array.from(checkboxes).every(cb => cb.checked);
        selectAll.indeterminate = selectedCount > 0 && selectedCount < checkboxes.length;
    }
}

// Load Results Page
function loadResultsPage() {
    updateResultElectionDropdown();
    loadResultsForElection();
}

// Update Result Election Dropdown
function updateResultElectionDropdown() {
    const elections = getElections();
    const select = document.getElementById('resultElectionSelect');

    if (select) {
        select.innerHTML = '<option value="">Select Election</option>';
        elections.forEach(election => {
            select.innerHTML += `<option value="${election.id}">${escapeHtml(election.name)}</option>`;
        });
    }
}

// Load Results for Selected Election
function loadResultsForElection() {
    const select = document.getElementById('resultElectionSelect');
    const container = document.getElementById('resultsGrid');
    const summaryContainer = document.getElementById('resultsSummary');
    const chartsContainer = document.getElementById('resultsCharts');

    if (!container) return;

    const electionId = select ? select.value : null;
    let results = [];
    let election = null;

    if (electionId) {
        results = getResults().filter(r => r.electionId == electionId);
        election = getElections().find(e => e.id == electionId);
    } else {
        results = getResults();
    }

    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No results available</p></div>';
        if (summaryContainer) summaryContainer.innerHTML = '';
        if (chartsContainer) chartsContainer.innerHTML = '';
        return;
    }

    if (summaryContainer) {
        const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
        const totalCandidates = results.length;
        const winner = results.sort((a, b) => b.votes - a.votes)[0];

        summaryContainer.innerHTML = `
            <div class="summary-stat">
                <span class="value">${totalVotes}</span>
                <span class="label">Total Votes</span>
            </div>
            <div class="summary-stat">
                <span class="value">${totalCandidates}</span>
                <span class="label">Candidates</span>
            </div>
            <div class="summary-stat">
                <span class="value">${winner.votes}</span>
                <span class="label">Winner Votes</span>
            </div>
        `;
    }

    container.innerHTML = '';
    results.sort((a, b) => b.votes - a.votes).forEach(result => {
        const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
        const percentage = totalVotes > 0 ? ((result.votes / totalVotes) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-header">
                <h3>${escapeHtml(result.candidate)}</h3>
                <span class="result-party">${escapeHtml(result.party)}</span>
            </div>
            <div class="result-bar-container">
                <div class="result-bar-label">
                    <span>${result.votes} votes</span>
                    <span>${percentage}%</span>
                </div>
                <div class="result-bar">
                    <div class="result-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    if (chartsContainer) {
        chartsContainer.innerHTML = `
            <div class="chart-card">
                <div class="chart-header">
                    <h3>Vote Distribution</h3>
                </div>
                <div class="chart-body">
                    <canvas id="resultPieChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-header">
                    <h3>Vote Comparison</h3>
                </div>
                <div class="chart-body">
                    <canvas id="resultBarChart"></canvas>
                </div>
            </div>
        `;

        createResultCharts(results);
    }
}

// Create Result Charts
function createResultCharts(results) {
    if (typeof Chart === 'undefined') return;

    if (charts.resultPie) charts.resultPie.destroy();
    if (charts.resultBar) charts.resultBar.destroy();

    const pieCtx = document.getElementById('resultPieChart')?.getContext('2d');
    const barCtx = document.getElementById('resultBarChart')?.getContext('2d');

    if (pieCtx) {
        charts.resultPie = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: results.map(r => r.candidate),
                datasets: [{
                    data: results.map(r => r.votes),
                    backgroundColor: [
                        '#6366f1',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#ec4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'var(--text-primary)'
                        }
                    }
                }
            }
        });
    }

    if (barCtx) {
        charts.resultBar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.candidate),
                datasets: [{
                    label: 'Votes',
                    data: results.map(r => r.votes),
                    backgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'var(--border-color)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    }
                }
            }
        });
    }
}

// Load Profile Settings
function loadProfileSettings() {
    const admin = getCurrentAdmin();
    if (!admin) return;

    const settings = JSON.parse(localStorage.getItem('profileSecuritySettings')) || {
        twoFactor: true,
        loginNotifications: true,
        sessionTimeout: '30',
        activityLogs: true,
        ipWhitelist: false
    };

    const twoFactorToggle = document.getElementById('twoFactorToggle');
    if (twoFactorToggle) twoFactorToggle.checked = settings.twoFactor;

    const loginNotifications = document.getElementById('loginNotifications');
    if (loginNotifications) loginNotifications.checked = settings.loginNotifications;

    const sessionTimeout = document.getElementById('sessionTimeout');
    if (sessionTimeout) sessionTimeout.value = settings.sessionTimeout;

    const activityLogs = document.getElementById('activityLogs');
    if (activityLogs) activityLogs.checked = settings.activityLogs;

    const ipWhitelist = document.getElementById('ipWhitelist');
    if (ipWhitelist) ipWhitelist.checked = settings.ipWhitelist;

    loadActivityLogs();
}

// Load Activity Logs
function loadActivityLogs() {
    const container = document.getElementById('activityLogList');
    if (!container) return;

    const activities = getActivities();

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state">No activity logs</div>';
        return;
    }

    container.innerHTML = '';
    activities.slice(0, 20).forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-log-item';
        item.innerHTML = `
            <div class="activity-log-time">${formatDateTime(activity.timestamp)}</div>
            <div class="activity-log-content">
                <div class="activity-log-title">${escapeHtml(activity.title)}</div>
                <div class="activity-log-desc">${escapeHtml(activity.description)}</div>
                <div class="activity-log-ip">IP: ${activity.ip || '127.0.0.1'}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Load Settings Page
function loadSettingsPage() {
    loadSystemSettings();
}

// Load System Settings
function loadSystemSettings() {
    const settings = JSON.parse(localStorage.getItem('systemSettings')) || {
        systemName: 'Online E-Voting System',
        systemUrl: 'https://evote.example.com',
        defaultLanguage: 'en',
        timeZone: 'UTC',
        enableRegistration: true,
        emailVerification: true,
        maintenanceMode: false,
        debugMode: false
    };

    const systemName = document.getElementById('systemName');
    if (systemName) systemName.value = settings.systemName;

    const systemUrl = document.getElementById('systemUrl');
    if (systemUrl) systemUrl.value = settings.systemUrl;

    const defaultLanguage = document.getElementById('defaultLanguage');
    if (defaultLanguage) defaultLanguage.value = settings.defaultLanguage;

    const timeZone = document.getElementById('timeZone');
    if (timeZone) timeZone.value = settings.timeZone;

    const enableRegistration = document.getElementById('enableRegistration');
    if (enableRegistration) enableRegistration.checked = settings.enableRegistration;

    const emailVerification = document.getElementById('emailVerification');
    if (emailVerification) emailVerification.checked = settings.emailVerification;

    const maintenanceMode = document.getElementById('maintenanceMode');
    if (maintenanceMode) maintenanceMode.checked = settings.maintenanceMode;

    const debugMode = document.getElementById('debugMode');
    if (debugMode) debugMode.checked = settings.debugMode;
}

// Update Election Dropdown
function updateElectionDropdown() {
    const elections = getElections();
    const select = document.getElementById('candidateElection');
    if (select) {
        select.innerHTML = '<option value="">Select Election</option>';
        elections.forEach(election => {
            select.innerHTML += `<option value="${election.name}">${escapeHtml(election.name)}</option>`;
        });
    }
}

// Update Notification Badge
function updateNotificationBadge() {
    const unreadCount = getUnreadNotificationCount();
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// Toggle Notifications
function toggleNotifications(e) {
    e.stopPropagation();
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.classList.toggle('show');
        loadNotifications();
    }
}

// Load Notifications
function loadNotifications() {
    const notifications = getNotifications();
    const container = document.getElementById('notificationsList');

    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
        return;
    }

    container.innerHTML = '';
    notifications.slice(0, 10).forEach(notification => {
        const item = document.createElement('div');
        item.className = `notification-item ${notification.read ? '' : 'unread'}`;
        item.onclick = () => markNotificationAsRead(notification.id);
        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${notification.type === 'success' ? 'check-circle' :
                notification.type === 'warning' ? 'exclamation-circle' :
                    notification.type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notification.title)}</div>
                <div class="notification-message">${escapeHtml(notification.message)}</div>
                <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Mark Notification as Read
function markNotificationAsRead(id) {
    markNotificationRead(id);
    updateNotificationBadge();
    loadNotifications();
}

// Mark All as Read
function markAllAsRead() {
    markAllNotificationsRead();
    updateNotificationBadge();
    loadNotifications();
    showToast('All notifications marked as read', 'success');
}

// Clear All Notifications
function clearAllNotifications() {
    showConfirmModal(
        'Clear All Notifications',
        'Are you sure you want to clear all notifications?',
        () => {
            clearNotifications();
            updateNotificationBadge();
            loadNotifications();
            showToast('All notifications cleared', 'success');
        }
    );
}

// View All Notifications
function viewAllNotifications() {
    document.getElementById('notificationsPanel')?.classList.remove('show');
    showToast('View all notifications feature coming soon', 'info');
}

// Format Date Time
function formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Format Time Ago
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

// Format Date
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}

// Close All Modals
function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Switch Profile Tab
function switchProfileTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const tabContent = document.getElementById(tab + 'Tab');
    if (tabContent) tabContent.classList.add('active');

    if (tab === 'activity') {
        loadActivityLogs();
    }
}

// Switch Settings Tab
function switchSettingsTab(setting) {
    document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`[data-setting="${setting}"]`);
    if (activeItem) activeItem.classList.add('active');

    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
    const panel = document.getElementById(setting + 'Settings');
    if (panel) panel.classList.add('active');
}

// Check Password Strength
function checkPasswordStrength() {
    const password = document.getElementById('newPassword');
    if (!password) return;

    const passwordValue = password.value;
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    const changeBtn = document.getElementById('changePasswordBtn');

    if (!strengthBar || !strengthText || !changeBtn) return;

    let strength = 0;

    const hasLength = passwordValue.length >= 8;
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasNumber = /[0-9]/.test(passwordValue);
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

    updateRequirement('reqLength', hasLength);
    updateRequirement('reqUppercase', hasUpper);
    updateRequirement('reqLowercase', hasLower);
    updateRequirement('reqNumber', hasNumber);
    updateRequirement('reqSpecial', hasSpecial);

    if (hasLength) strength += 20;
    if (hasUpper) strength += 20;
    if (hasLower) strength += 20;
    if (hasNumber) strength += 20;
    if (hasSpecial) strength += 20;

    strengthBar.style.width = strength + '%';

    if (strength < 40) {
        strengthBar.style.backgroundColor = '#ef4444';
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
    } else if (strength < 80) {
        strengthBar.style.backgroundColor = '#f59e0b';
        strengthText.textContent = 'Medium';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthBar.style.backgroundColor = '#10b981';
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }

    const currentPwd = document.getElementById('currentPassword');
    const confirmPwd = document.getElementById('confirmPassword');
    const currentPwdValue = currentPwd ? currentPwd.value : '';
    const confirmPwdValue = confirmPwd ? confirmPwd.value : '';

    changeBtn.disabled = !(currentPwdValue && passwordValue && confirmPwdValue && passwordValue === confirmPwdValue && strength >= 80);
}

// Update Requirement
function updateRequirement(id, met) {
    const element = document.getElementById(id);
    if (!element) return;

    const icon = element.querySelector('i');
    const text = element.innerText.replace(/^[^A-Za-z]+/, '');
    if (met) {
        element.classList.add('valid');
        element.innerHTML = '<i class="fas fa-check-circle"></i> ' + text;
    } else {
        element.classList.remove('valid');
        element.innerHTML = '<i class="fas fa-circle"></i> ' + text;
    }
}

// Validate Password Match
function validatePasswordMatch() {
    const newPwd = document.getElementById('newPassword');
    const confirmPwd = document.getElementById('confirmPassword');

    if (!newPwd || !confirmPwd) return;

    if (confirmPwd.value && newPwd.value !== confirmPwd.value) {
        showToast('Passwords do not match', 'error');
    }

    checkPasswordStrength();
}

// Change Password
function changePassword() {
    const current = document.getElementById('currentPassword');
    const newPwd = document.getElementById('newPassword');

    if (!current || !newPwd) return;

    const admin = getCurrentAdmin();
    if (!admin) return;

    if (current.value !== admin.password) {
        showToast('Current password is incorrect', 'error');
        return;
    }

    admin.password = newPwd.value;
    updateAdmin(admin);
    showToast('Password changed successfully!', 'success');
    resetPasswordForm();
}

// Reset Password Form
function resetPasswordForm() {
    const currentPwd = document.getElementById('currentPassword');
    const newPwd = document.getElementById('newPassword');
    const confirmPwd = document.getElementById('confirmPassword');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const changeBtn = document.getElementById('changePasswordBtn');

    if (currentPwd) currentPwd.value = '';
    if (newPwd) newPwd.value = '';
    if (confirmPwd) confirmPwd.value = '';
    if (strengthBar) {
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = '';
    }
    if (changeBtn) changeBtn.disabled = true;

    ['reqLength', 'reqUppercase', 'reqLowercase', 'reqNumber', 'reqSpecial'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('valid');
            el.innerHTML = '<i class="fas fa-circle"></i> ' + el.innerText.substring(1);
        }
    });
}

// Update Personal Info
function updatePersonalInfo() {
    const nameInput = document.getElementById('profileFullName');
    const emailInput = document.getElementById('profileEmailInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const bioInput = document.getElementById('profileBio');
    const locationInput = document.getElementById('profileLocation');
    const departmentInput = document.getElementById('profileDepartment');

    if (!nameInput || !emailInput) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const bio = bioInput ? bioInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';
    const department = departmentInput ? departmentInput.value : 'admin';

    if (!name || !email) {
        showToast('Name and email are required', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    const admin = getCurrentAdmin();
    if (!admin) return;

    admin.name = name;
    admin.email = email;
    admin.phone = phone;
    admin.bio = bio;
    admin.location = location;
    admin.department = department;

    updateAdmin(admin);
    updateAdminInfo();
    showToast('Profile updated successfully!', 'success');
}

// Reset Personal Info
function resetPersonalInfo() {
    const admin = getCurrentAdmin();
    if (!admin) return;

    const nameInput = document.getElementById('profileFullName');
    const emailInput = document.getElementById('profileEmailInput');
    const phoneInput = document.getElementById('profilePhoneInput');
    const bioInput = document.getElementById('profileBio');
    const locationInput = document.getElementById('profileLocation');
    const departmentInput = document.getElementById('profileDepartment');

    if (nameInput) nameInput.value = admin.name;
    if (emailInput) emailInput.value = admin.email;
    if (phoneInput) phoneInput.value = admin.phone || '+91 9876543210';
    if (bioInput) bioInput.value = admin.bio || '';
    if (locationInput) locationInput.value = admin.location || '';
    if (departmentInput) departmentInput.value = admin.department || 'admin';

    showToast('Form reset', 'info');
}

// Save Security Settings
function saveSecuritySettings() {
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    const loginNotifications = document.getElementById('loginNotifications');
    const sessionTimeout = document.getElementById('sessionTimeout');
    const activityLogs = document.getElementById('activityLogs');
    const ipWhitelist = document.getElementById('ipWhitelist');

    const settings = {
        twoFactor: twoFactorToggle ? twoFactorToggle.checked : true,
        loginNotifications: loginNotifications ? loginNotifications.checked : true,
        sessionTimeout: sessionTimeout ? sessionTimeout.value : '30',
        activityLogs: activityLogs ? activityLogs.checked : true,
        ipWhitelist: ipWhitelist ? ipWhitelist.checked : false
    };

    localStorage.setItem('profileSecuritySettings', JSON.stringify(settings));
    showToast('Security settings saved!', 'success');
}

// Save General Settings
function saveGeneralSettings() {
    const systemName = document.getElementById('systemName');
    const systemUrl = document.getElementById('systemUrl');
    const defaultLanguage = document.getElementById('defaultLanguage');
    const timeZone = document.getElementById('timeZone');

    const settings = {
        systemName: systemName ? systemName.value : 'Online E-Voting System',
        systemUrl: systemUrl ? systemUrl.value : 'https://evote.example.com',
        defaultLanguage: defaultLanguage ? defaultLanguage.value : 'en',
        timeZone: timeZone ? timeZone.value : 'UTC'
    };

    localStorage.setItem('generalSettings', JSON.stringify(settings));
    showToast('General settings saved!', 'success');
}

// Save System Settings
function saveSystemSettings() {
    const enableRegistration = document.getElementById('enableRegistration');
    const emailVerification = document.getElementById('emailVerification');
    const maintenanceMode = document.getElementById('maintenanceMode');
    const debugMode = document.getElementById('debugMode');

    const settings = {
        enableRegistration: enableRegistration ? enableRegistration.checked : true,
        emailVerification: emailVerification ? emailVerification.checked : true,
        maintenanceMode: maintenanceMode ? maintenanceMode.checked : false,
        debugMode: debugMode ? debugMode.checked : false
    };

    localStorage.setItem('systemSettings', JSON.stringify(settings));
    showToast('System settings saved!', 'success');
}

// Save Email Settings
function saveEmailSettings() {
    const smtpServer = document.getElementById('smtpServer');
    const smtpPort = document.getElementById('smtpPort');
    const smtpUsername = document.getElementById('smtpUsername');
    const smtpPassword = document.getElementById('smtpPassword');
    const emailNotifications = document.getElementById('emailNotifications');

    const settings = {
        smtpServer: smtpServer ? smtpServer.value : '',
        smtpPort: smtpPort ? smtpPort.value : '587',
        smtpUsername: smtpUsername ? smtpUsername.value : '',
        smtpPassword: smtpPassword ? smtpPassword.value : '',
        emailNotifications: emailNotifications ? emailNotifications.checked : true
    };

    localStorage.setItem('emailSettings', JSON.stringify(settings));
    showToast('Email settings saved!', 'success');
}

// Test Email Settings
function testEmailSettings() {
    showToast('Test email sent! Check your inbox.', 'success');
}

// Save Backup Settings
function saveBackupSettings() {
    const autoBackup = document.getElementById('autoBackup');
    const backupFrequency = document.getElementById('backupFrequency');
    const backupRetention = document.getElementById('backupRetention');
    const backupLocation = document.getElementById('backupLocation');

    const settings = {
        autoBackup: autoBackup ? autoBackup.checked : true,
        backupFrequency: backupFrequency ? backupFrequency.value : 'weekly',
        backupRetention: backupRetention ? backupRetention.value : '90',
        backupLocation: backupLocation ? backupLocation.value : 'local'
    };

    localStorage.setItem('backupSettings', JSON.stringify(settings));
    showToast('Backup settings saved!', 'success');
}

// Backup Now
function backupNow() {
    showToast('Backup started...', 'info');
    setTimeout(() => {
        showToast('Backup completed successfully!', 'success');
    }, 2000);
}

// Save API Settings
function saveApiSettings() {
    const apiEnabled = document.getElementById('apiEnabled');
    const rateLimit = document.getElementById('rateLimit');
    const allowedIps = document.getElementById('allowedIps');

    const settings = {
        apiEnabled: apiEnabled ? apiEnabled.checked : true,
        rateLimit: rateLimit ? rateLimit.value : '60',
        allowedIps: allowedIps ? allowedIps.value : '*'
    };

    localStorage.setItem('apiSettings', JSON.stringify(settings));
    showToast('API settings saved!', 'success');
}

// Copy API Key
function copyApiKey() {
    const apiKey = document.getElementById('apiKey');
    if (apiKey) {
        apiKey.select();
        document.execCommand('copy');
        showToast('API key copied to clipboard!', 'success');
    }
}

// Regenerate API Key
function regenerateApiKey() {
    showConfirmModal(
        'Regenerate API Key',
        'Are you sure you want to regenerate your API key? The old key will stop working.',
        () => {
            const newKey = 'evt_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const apiKey = document.getElementById('apiKey');
            if (apiKey) apiKey.value = newKey;
            showToast('API key regenerated successfully!', 'success');
        }
    );
}

// Validate Email
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Change Avatar
function changeAvatar() {
    showToast('Avatar change feature coming soon!', 'info');
}

// Open Election Modal
function openElectionModal() {
    currentEditingElection = null;
    const modal = document.getElementById('electionModal');
    const title = document.getElementById('electionModalTitle');

    if (title) title.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Election';

    const nameInput = document.getElementById('electionName');
    const startDate = document.getElementById('electionStartDate');
    const endDate = document.getElementById('electionEndDate');
    const areas = document.getElementById('electionAreas');
    const seats = document.getElementById('electionSeats');
    const electionType = document.getElementById('electionType');
    const announce = document.getElementById('announceElection');
    const allowMultiple = document.getElementById('allowMultipleVotes');

    if (nameInput) nameInput.value = '';
    if (startDate) startDate.value = '';
    if (endDate) endDate.value = '';
    if (areas) areas.value = '';
    if (seats) seats.value = '1';
    if (electionType) electionType.value = 'general';
    if (announce) announce.checked = false;
    if (allowMultiple) allowMultiple.checked = false;

    if (modal) modal.classList.add('show');
}

// Open Candidate Modal
function openCandidateModal() {
    currentEditingCandidate = null;
    const modal = document.getElementById('candidateModal');

    const nameInput = document.getElementById('candidateName');
    const photoInput = document.getElementById('candidatePhoto');
    const emailInput = document.getElementById('candidateEmail');
    const phoneInput = document.getElementById('candidatePhone');
    const partyInput = document.getElementById('candidateParty');
    const symbolInput = document.getElementById('candidateSymbol');
    const electionSelect = document.getElementById('candidateElection');
    const bioInput = document.getElementById('candidateBio');

    if (nameInput) nameInput.value = '';
    if (photoInput) photoInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (partyInput) partyInput.value = '';
    if (symbolInput) symbolInput.value = '';
    if (electionSelect) electionSelect.value = '';
    if (bioInput) bioInput.value = '';

    if (modal) modal.classList.add('show');
}

// Open Voter Modal
function openVoterModal() {
    currentEditingVoter = null;
    const modal = document.getElementById('voterModal');

    const nameInput = document.getElementById('voterName');
    const emailInput = document.getElementById('voterEmail');
    const idInput = document.getElementById('voterId');
    const phoneInput = document.getElementById('voterPhone');
    const dobInput = document.getElementById('voterDob');
    const constituencyInput = document.getElementById('voterConstituency');
    const canVote = document.getElementById('voterCanVote');
    const sendEmail = document.getElementById('sendVoterEmail');

    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (idInput) idInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (dobInput) dobInput.value = '';
    if (constituencyInput) constituencyInput.value = '';
    if (canVote) canVote.checked = true;
    if (sendEmail) sendEmail.checked = true;

    if (modal) modal.classList.add('show');
}

// Open Bulk Upload Modal
function openBulkUploadModal() {
    const modal = document.getElementById('bulkUploadModal');
    const preview = document.getElementById('uploadPreview');
    const processBtn = document.getElementById('processUploadBtn');

    if (preview) preview.style.display = 'none';
    if (processBtn) processBtn.disabled = true;

    if (modal) modal.classList.add('show');
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// Handle File Drop
function handleFileDrop(e) {
    e.preventDefault();
    const dropArea = document.getElementById('dropArea');
    if (dropArea) dropArea.style.borderColor = 'var(--border-color)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Handle File Select
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Process File
function processFile(file) {
    if (file.type !== 'text/csv') {
        showToast('Please upload a CSV file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        previewCSV(content);
    };
    reader.readAsText(file);
}

// Preview CSV
function previewCSV(content) {
    const preview = document.getElementById('uploadPreview');
    const processBtn = document.getElementById('processUploadBtn');

    if (!preview || !processBtn) return;

    const lines = content.split('\n').slice(0, 5);
    let html = '<table class="preview-table">';

    lines.forEach(line => {
        if (line.trim()) {
            html += '<tr>';
            const cells = line.split(',');
            cells.forEach(cell => {
                html += `<td>${escapeHtml(cell)}</td>`;
            });
            html += '</tr>';
        }
    });

    html += '</table>';

    const previewContainer = preview.querySelector('.preview-table');
    if (previewContainer) {
        previewContainer.innerHTML = html;
    }
    preview.style.display = 'block';
    processBtn.disabled = false;

    window.uploadCSVData = content;
}

// Download Sample CSV
function downloadSampleCsv() {
    const headers = ['name', 'email', 'party', 'election'];
    const sampleData = [
        ['John Doe', 'john@example.com', 'Democratic Party', 'General Election 2026'],
        ['Jane Smith', 'jane@example.com', 'Republican Party', 'General Election 2026']
    ];

    let csv = headers.join(',') + '\n';
    sampleData.forEach(row => {
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_candidates.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Process Bulk Upload
function processBulkUpload() {
    if (!window.uploadCSVData) return;

    const lines = window.uploadCSVData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    let addedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const candidate = {};

        headers.forEach((header, index) => {
            candidate[header] = values[index] || '';
        });

        if (candidate.name && candidate.email) {
            candidate.votes = 0;
            addCandidate(candidate);
            addedCount++;
        }
    }

    closeModal('bulkUploadModal');
    loadCandidates();
    showToast(`Successfully added ${addedCount} candidates`, 'success');
}

// Save Election
function saveElection() {
    const nameInput = document.getElementById('electionName');
    const startDate = document.getElementById('electionStartDate');
    const endDate = document.getElementById('electionEndDate');
    const areas = document.getElementById('electionAreas');
    const seats = document.getElementById('electionSeats');
    const electionType = document.getElementById('electionType');
    const announce = document.getElementById('announceElection');
    const allowMultiple = document.getElementById('allowMultipleVotes');

    if (!nameInput || !startDate || !endDate || !areas || !seats) return;

    const name = nameInput.value.trim();
    const startDateValue = startDate.value;
    const endDateValue = endDate.value;
    const areasValue = areas.value.trim();
    const seatsValue = parseInt(seats.value);
    const typeValue = electionType ? electionType.value : 'general';
    const announced = announce ? announce.checked : false;
    const multipleVotes = allowMultiple ? allowMultiple.checked : false;

    if (!name || !startDateValue || !endDateValue || !areasValue) {
        showToast('Please fill all fields', 'error');
        return;
    }

    if (new Date(endDateValue) <= new Date(startDateValue)) {
        showToast('End date must be after start date', 'error');
        return;
    }

    const now = new Date();
    const start = new Date(startDateValue);
    let status = 'Upcoming';
    if (start <= now) status = 'Open';
    if (new Date(endDateValue) < now) status = 'Closed';

    const election = {
        id: currentEditingElection || Date.now(),
        name,
        startDate: startDateValue,
        endDate: endDateValue,
        areas: areasValue,
        seats: seatsValue,
        type: typeValue,
        status: status,
        announced,
        multipleVotes,
        createdAt: new Date().toISOString()
    };

    if (currentEditingElection) {
        if (updateElection(currentEditingElection, election)) {
            showToast('Election updated successfully!', 'success');
        }
    } else {
        addElection(election);
        addNotification({
            id: Date.now(),
            type: 'info',
            title: 'New Election Created',
            message: `Election "${name}" has been created`,
            timestamp: new Date().toISOString(),
            read: false
        });
        showToast('Election created successfully!', 'success');
    }

    closeModal('electionModal');
    loadElections();
    loadDashboard();
    updateNotificationBadge();
}

// Edit Election
function editElection(id) {
    const election = getElectionById(id);

    if (!election) return;

    currentEditingElection = election.id;

    const title = document.getElementById('electionModalTitle');
    if (title) title.innerHTML = '<i class="fas fa-edit"></i> Edit Election';

    const nameInput = document.getElementById('electionName');
    const startDate = document.getElementById('electionStartDate');
    const endDate = document.getElementById('electionEndDate');
    const areas = document.getElementById('electionAreas');
    const seats = document.getElementById('electionSeats');
    const electionType = document.getElementById('electionType');
    const announce = document.getElementById('announceElection');
    const allowMultiple = document.getElementById('allowMultipleVotes');

    if (nameInput) nameInput.value = election.name;
    if (startDate) startDate.value = election.startDate;
    if (endDate) endDate.value = election.endDate;
    if (areas) areas.value = election.areas;
    if (seats) seats.value = election.seats || 1;
    if (electionType) electionType.value = election.type || 'general';
    if (announce) announce.checked = election.announced || false;
    if (allowMultiple) allowMultiple.checked = election.multipleVotes || false;

    const modal = document.getElementById('electionModal');
    if (modal) modal.classList.add('show');
}

// Delete Election
function deleteElection(id) {
    showConfirmModal(
        'Delete Election',
        'Are you sure you want to delete this election? This action cannot be undone.',
        () => {
            removeElection(id);
            showToast('Election deleted successfully!', 'success');
            loadElections();
            loadDashboard();
            updateNotificationBadge();
        }
    );
}

// Save Candidate
function saveCandidate() {
    const nameInput = document.getElementById('candidateName');
    const photoInput = document.getElementById('candidatePhoto');
    const emailInput = document.getElementById('candidateEmail');
    const phoneInput = document.getElementById('candidatePhone');
    const partyInput = document.getElementById('candidateParty');
    const symbolInput = document.getElementById('candidateSymbol');
    const electionSelect = document.getElementById('candidateElection');
    const bioInput = document.getElementById('candidateBio');

    if (!nameInput || !emailInput || !partyInput || !electionSelect) return;

    const name = nameInput.value.trim();
    const photo = photoInput ? photoInput.value.trim() : '';
    const email = emailInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const party = partyInput.value.trim();
    const symbol = symbolInput ? symbolInput.value.trim() : '';
    const election = electionSelect.value;
    const bio = bioInput ? bioInput.value.trim() : '';

    if (!name || !email || !party || !election) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    const candidate = {
        name,
        photo,
        email,
        phone,
        party,
        symbol,
        election,
        bio,
        votes: 0,
        createdAt: new Date().toISOString()
    };

    if (currentEditingCandidate) {
        if (updateCandidate(currentEditingCandidate, candidate)) {
            showToast('Candidate updated successfully!', 'success');
        }
    } else {
        addCandidate(candidate);
        addNotification({
            id: Date.now(),
            type: 'success',
            title: 'New Candidate Added',
            message: `Candidate "${name}" has been added to ${election}`,
            timestamp: new Date().toISOString(),
            read: false
        });
        showToast('Candidate added successfully!', 'success');
    }

    closeModal('candidateModal');
    loadCandidates();
    loadDashboard();
    updateNotificationBadge();
}

// Edit Candidate
function editCandidate(email) {
    const candidate = getCandidateByEmail(email);

    if (!candidate) return;

    currentEditingCandidate = candidate.email;

    const nameInput = document.getElementById('candidateName');
    const photoInput = document.getElementById('candidatePhoto');
    const emailInput = document.getElementById('candidateEmail');
    const phoneInput = document.getElementById('candidatePhone');
    const partyInput = document.getElementById('candidateParty');
    const symbolInput = document.getElementById('candidateSymbol');
    const electionSelect = document.getElementById('candidateElection');
    const bioInput = document.getElementById('candidateBio');

    if (nameInput) nameInput.value = candidate.name;
    if (photoInput) photoInput.value = candidate.photo || '';
    if (emailInput) emailInput.value = candidate.email;
    if (phoneInput) phoneInput.value = candidate.phone || '';
    if (partyInput) partyInput.value = candidate.party;
    if (symbolInput) symbolInput.value = candidate.symbol || '';
    if (electionSelect) electionSelect.value = candidate.election;
    if (bioInput) bioInput.value = candidate.bio || '';

    const modal = document.getElementById('candidateModal');
    if (modal) modal.classList.add('show');
}

// Delete Candidate
function deleteCandidate(email) {
    showConfirmModal(
        'Delete Candidate',
        'Are you sure you want to delete this candidate?',
        () => {
            removeCandidate(email);
            showToast('Candidate deleted successfully!', 'success');
            loadCandidates();
            loadDashboard();
        }
    );
}

// Save Voter
function saveVoter() {
    const nameInput = document.getElementById('voterName');
    const emailInput = document.getElementById('voterEmail');
    const idInput = document.getElementById('voterId');
    const phoneInput = document.getElementById('voterPhone');
    const dobInput = document.getElementById('voterDob');
    const constituencyInput = document.getElementById('voterConstituency');
    const canVote = document.getElementById('voterCanVote');
    const sendEmail = document.getElementById('sendVoterEmail');

    if (!nameInput || !emailInput || !idInput) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const voterId = idInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const dob = dobInput ? dobInput.value : '';
    const constituency = constituencyInput ? constituencyInput.value.trim() : '';
    const allowVote = canVote ? canVote.checked : true;
    const shouldSendEmail = sendEmail ? sendEmail.checked : false;

    if (!name || !email || !voterId) {
        showToast('Please fill all fields', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showToast('Please enter a valid email', 'error');
        return;
    }

    const voter = {
        name,
        email,
        voterId,
        phone,
        dob,
        constituency,
        voted: false,
        votedIn: 'None',
        canVote: allowVote,
        registeredDate: formatDate(new Date()),
        createdAt: new Date().toISOString()
    };

    if (currentEditingVoter) {
        if (updateVoter(currentEditingVoter, voter)) {
            showToast('Voter updated successfully!', 'success');
        }
    } else {
        addVoter(voter);
        addNotification({
            id: Date.now(),
            type: 'info',
            title: 'New Voter Registered',
            message: `Voter "${name}" has been registered`,
            timestamp: new Date().toISOString(),
            read: false
        });
        showToast('Voter added successfully!', 'success');

        if (shouldSendEmail) {
            setTimeout(() => {
                showToast(`Registration email sent to ${email}`, 'success');
            }, 1000);
        }
    }

    closeModal('voterModal');
    loadVoters();
    loadDashboard();
    updateNotificationBadge();
}

// Edit Voter
function editVoter(voterId) {
    const voter = getVoterById(voterId);

    if (!voter) return;

    currentEditingVoter = voter.voterId;

    const nameInput = document.getElementById('voterName');
    const emailInput = document.getElementById('voterEmail');
    const idInput = document.getElementById('voterId');
    const phoneInput = document.getElementById('voterPhone');
    const dobInput = document.getElementById('voterDob');
    const constituencyInput = document.getElementById('voterConstituency');
    const canVote = document.getElementById('voterCanVote');
    const sendEmail = document.getElementById('sendVoterEmail');

    if (nameInput) nameInput.value = voter.name;
    if (emailInput) emailInput.value = voter.email;
    if (idInput) idInput.value = voter.voterId;
    if (phoneInput) phoneInput.value = voter.phone || '';
    if (dobInput) dobInput.value = voter.dob || '';
    if (constituencyInput) constituencyInput.value = voter.constituency || '';
    if (canVote) canVote.checked = voter.canVote !== false;
    if (sendEmail) sendEmail.checked = false;

    const modal = document.getElementById('voterModal');
    if (modal) modal.classList.add('show');
}

// Delete Voter
function deleteVoter(voterId) {
    showConfirmModal(
        'Delete Voter',
        'Are you sure you want to delete this voter?',
        () => {
            removeVoter(voterId);
            showToast('Voter deleted successfully!', 'success');
            loadVoters();
            loadDashboard();
        }
    );
}

// Show Participation Details
function showParticipationDetails() {
    const modal = document.getElementById('participationModal');
    if (!modal) return;

    const stats = getAdminStats();
    const voters = getVoters();
    const elections = getElections();

    const summaryTotalVoters = document.getElementById('summaryTotalVoters');
    if (summaryTotalVoters) summaryTotalVoters.textContent = stats.totalVoters;

    const summaryVoted = document.getElementById('summaryVoted');
    if (summaryVoted) summaryVoted.textContent = stats.votedCount;

    const summaryNotVoted = document.getElementById('summaryNotVoted');
    if (summaryNotVoted) summaryNotVoted.textContent = stats.totalVoters - stats.votedCount;

    const summaryRate = document.getElementById('summaryRate');
    if (summaryRate) {
        const rate = stats.totalVoters > 0 ? Math.round((stats.votedCount / stats.totalVoters) * 100) : 0;
        summaryRate.textContent = rate + '%';
    }

    const listContainer = document.getElementById('electionParticipationList');
    if (listContainer) {
        if (elections.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No elections found</div>';
        } else {
            listContainer.innerHTML = '';
            elections.forEach(election => {
                const electionVoters = voters.filter(v => v.votedIn === election.name).length;
                const electionVoted = voters.filter(v => v.votedIn === election.name && v.voted).length;
                const percentage = electionVoters > 0 ? Math.round((electionVoted / electionVoters) * 100) : 0;

                const item = document.createElement('div');
                item.className = 'election-participation-item';
                item.style.marginBottom = '1rem';
                item.innerHTML = `
                    <h5 style="margin-bottom: 0.5rem; color: var(--text-primary);">${escapeHtml(election.name)}</h5>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Voted: ${electionVoted}/${electionVoters}</span>
                        <span>${percentage}%</span>
                    </div>
                    <div style="height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: var(--primary);"></div>
                    </div>
                `;
                listContainer.appendChild(item);
            });
        }
    }

    createParticipationChart();

    modal.classList.add('show');
}

// Create Participation Chart
function createParticipationChart() {
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('participationChart')?.getContext('2d');
    if (!ctx) return;

    const stats = getAdminStats();
    const voted = stats.votedCount;
    const notVoted = stats.totalVoters - voted;

    if (charts.participation) charts.participation.destroy();

    charts.participation = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Voted', 'Not Voted'],
            datasets: [{
                data: [voted, notVoted],
                backgroundColor: ['#6366f1', '#374151'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// ==================== PDF EXPORT HELPERS ====================

function createPDFDoc(title) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header background
    doc.setFillColor(30, 30, 47);
    doc.rect(0, 0, 210, 28, 'F');

    // Logo text
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('E-VOTE', 14, 16);

    // Header title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(title, 50, 16);

    // Date
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 200);
    doc.text('Generated: ' + new Date().toLocaleString(), 14, 24);

    // Divider line
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(14, 30, 196, 30);

    return doc;
}

function savePDF(doc, filename) {
    doc.save(filename + '-' + new Date().toISOString().split('T')[0] + '.pdf');
}

// ==================== EXPORT ELECTIONS PDF ====================
function exportElections() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh.', 'error');
        return;
    }

    showToast('Generating Elections PDF...', 'info');
    const elections = getElections();
    const doc = createPDFDoc('Manage Elections Report');

    // Summary
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Elections: ' + elections.length, 14, 37);

    const statusCount = { Open: 0, Upcoming: 0, Closed: 0 };
    elections.forEach(e => { if (statusCount[e.status] !== undefined) statusCount[e.status]++; });
    doc.text('Open: ' + statusCount.Open + '   Upcoming: ' + statusCount.Upcoming + '   Closed: ' + statusCount.Closed, 14, 43);

    // Table
    const tableData = elections.map((e, i) => [
        i + 1,
        e.name || '',
        e.startDate || '',
        e.endDate || '',
        e.areas || '',
        e.seats || 1,
        e.status || ''
    ]);

    doc.autoTable({
        startY: 48,
        head: [['#', 'Election Name', 'Start Date', 'End Date', 'Areas', 'Seats', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 55 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 35 },
            5: { cellWidth: 15 },
            6: { cellWidth: 22 }
        },
        didDrawCell: (data) => {
            if (data.column.index === 6 && data.section === 'body') {
                const status = data.cell.raw;
                const colors = { Open: [34, 197, 94], Upcoming: [251, 191, 36], Closed: [239, 68, 68] };
                const col = colors[status] || [120, 120, 140];
                data.cell.styles.textColor = col;
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 170);
        doc.text('E-Vote Admin Portal | Elections Report | Page ' + i + ' of ' + pageCount, 14, 290);
    }

    addActivity('export', 'Elections PDF exported');
    savePDF(doc, 'elections-report');
    showToast('Elections PDF exported successfully!', 'success');
}

// ==================== EXPORT CANDIDATES PDF ====================
function exportCandidatesPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh.', 'error');
        return;
    }

    showToast('Generating Candidates PDF...', 'info');
    const candidates = getCandidates();
    const doc = createPDFDoc('Manage Candidates Report');

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Candidates: ' + candidates.length, 14, 37);

    const parties = [...new Set(candidates.map(c => c.party).filter(Boolean))];
    doc.text('Parties Represented: ' + parties.length, 14, 43);

    const tableData = candidates.map((c, i) => [
        i + 1,
        c.name || '',
        c.email || '',
        c.party || '',
        c.election || '',
        c.votes !== undefined ? c.votes : 0,
        c.status || 'Active'
    ]);

    doc.autoTable({
        startY: 48,
        head: [['#', 'Name', 'Email', 'Party', 'Election', 'Votes', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 38 },
            2: { cellWidth: 45 },
            3: { cellWidth: 30 },
            4: { cellWidth: 35 },
            5: { cellWidth: 15 },
            6: { cellWidth: 14 }
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 170);
        doc.text('E-Vote Admin Portal | Candidates Report | Page ' + i + ' of ' + pageCount, 14, 290);
    }

    addActivity('export', 'Candidates PDF exported');
    savePDF(doc, 'candidates-report');
    showToast('Candidates PDF exported successfully!', 'success');
}

// ==================== EXPORT VOTERS PDF ====================
function exportVotersPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh.', 'error');
        return;
    }

    showToast('Generating Voters PDF...', 'info');
    const voters = getVoters();
    const doc = createPDFDoc('Manage Voters Report');

    const voted = voters.filter(v => v.voted).length;
    const notVoted = voters.length - voted;
    const rate = voters.length > 0 ? Math.round((voted / voters.length) * 100) : 0;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Voters: ' + voters.length + '   Voted: ' + voted + '   Not Voted: ' + notVoted + '   Participation: ' + rate + '%', 14, 37);

    const tableData = voters.map((v, i) => [
        i + 1,
        v.name || '',
        v.email || '',
        v.voterId || '',
        v.constituency || '',
        v.voted ? 'Voted' : 'Not Voted',
        v.votedIn || '-',
        v.registeredDate ? new Date(v.registeredDate).toLocaleDateString() : ''
    ]);

    doc.autoTable({
        startY: 44,
        head: [['#', 'Name', 'Email', 'Voter ID', 'Constituency', 'Status', 'Voted In', 'Registered']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [255, 252, 235] },
        columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 30 },
            2: { cellWidth: 42 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 18 },
            6: { cellWidth: 30 },
            7: { cellWidth: 22 }
        },
        didDrawCell: (data) => {
            if (data.column.index === 5 && data.section === 'body') {
                data.cell.styles.textColor = data.cell.raw === 'Voted' ? [34, 197, 94] : [239, 68, 68];
            }
        }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 170);
        doc.text('E-Vote Admin Portal | Voters Report | Page ' + i + ' of ' + pageCount, 14, 290);
    }

    addActivity('export', 'Voters PDF exported');
    savePDF(doc, 'voters-report');
    showToast('Voters PDF exported successfully!', 'success');
}

// ==================== EXPORT RESULTS PDF ====================
function exportResults() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh.', 'error');
        return;
    }

    showToast('Generating Election Results PDF...', 'info');
    const results = getResults ? getResults() : [];
    const elections = getElections();
    const voters = getVoters();
    const candidates = getCandidates();
    const doc = createPDFDoc('Election Results Report');

    const stats = getAdminStats ? getAdminStats() : {};
    const totalVotes = stats.totalVotes || 0;
    const participation = stats.totalVoters > 0 ? Math.round((stats.votedCount / stats.totalVoters) * 100) : 0;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 140);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Elections: ' + elections.length + '   Total Votes Cast: ' + totalVotes + '   Overall Participation: ' + participation + '%', 14, 37);

    let currentY = 44;

    // Results per election
    elections.forEach((election, eIdx) => {
        const electionCandidates = candidates.filter(c => c.election === election.name);
        const totalElectionVotes = electionCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);

        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }

        // Election header
        doc.setFillColor(30, 30, 47);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text((eIdx + 1) + '. ' + election.name + ' | Status: ' + election.status + ' | Total Votes: ' + totalElectionVotes, 16, currentY + 5.5);
        currentY += 11;

        if (electionCandidates.length === 0) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 170);
            doc.setFont('helvetica', 'normal');
            doc.text('No candidates registered for this election.', 16, currentY + 4);
            currentY += 10;
            return;
        }

        const sorted = [...electionCandidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
        const tableRows = sorted.map((c, i) => {
            const pct = totalElectionVotes > 0 ? ((c.votes || 0) / totalElectionVotes * 100).toFixed(1) : '0.0';
            return [i + 1, c.name || '', c.party || '', c.votes || 0, pct + '%', i === 0 && totalElectionVotes > 0 ? 'Winner' : ''];
        });

        doc.autoTable({
            startY: currentY,
            head: [['Rank', 'Candidate', 'Party', 'Votes', 'Vote %', 'Result']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            columnStyles: {
                0: { cellWidth: 12 },
                1: { cellWidth: 50 },
                2: { cellWidth: 40 },
                3: { cellWidth: 20 },
                4: { cellWidth: 22 },
                5: { cellWidth: 30 }
            },
            didDrawCell: (data) => {
                if (data.column.index === 5 && data.section === 'body' && data.cell.raw === 'Winner') {
                    data.cell.styles.textColor = [34, 197, 94];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (data.row.index === 0 && data.section === 'body') {
                    data.cell.styles.fillColor = [230, 255, 240];
                }
            },
            margin: { left: 14, right: 14 }
        });

        currentY = doc.lastAutoTable.finalY + 8;
    });

    // Participation summary section
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    doc.setFillColor(30, 30, 47);
    doc.rect(14, currentY, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Voter Participation Summary', 16, currentY + 5.5);
    currentY += 11;

    const partRows = elections.map(el => {
        const elVoters = voters.filter(v => v.votedIn === el.name).length;
        const elVoted = voters.filter(v => v.votedIn === el.name && v.voted).length;
        const pct = elVoters > 0 ? Math.round((elVoted / elVoters) * 100) : 0;
        return [el.name, elVoters, elVoted, elVoters - elVoted, pct + '%', el.status];
    });

    doc.autoTable({
        startY: currentY,
        head: [['Election', 'Total Voters', 'Voted', 'Not Voted', 'Rate', 'Status']],
        body: partRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        margin: { left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 170);
        doc.text('E-Vote Admin Portal | Election Results Report | Page ' + i + ' of ' + pageCount, 14, 290);
    }

    addActivity('export', 'Results PDF report exported');
    savePDF(doc, 'election-results-report');
    showToast('Election Results PDF exported successfully!', 'success');
}

// ==================== EXPORT PARTICIPATION DATA PDF ====================
function exportParticipationData() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded. Please refresh.', 'error');
        return;
    }

    showToast('Generating Participation PDF...', 'info');
    const stats = getAdminStats ? getAdminStats() : {};
    const voters = getVoters();
    const elections = getElections();
    const doc = createPDFDoc('Voter Participation Report');

    const voted = stats.votedCount || 0;
    const total = stats.totalVoters || 0;
    const notVoted = total - voted;
    const rate = total > 0 ? Math.round((voted / total) * 100) : 0;

    // Summary boxes
    const boxes = [
        { label: 'Total Voters', value: total, color: [99, 102, 241] },
        { label: 'Voters Voted', value: voted, color: [16, 185, 129] },
        { label: 'Not Voted', value: notVoted, color: [239, 68, 68] },
        { label: 'Participation Rate', value: rate + '%', color: [245, 158, 11] }
    ];

    let bx = 14;
    boxes.forEach(box => {
        doc.setFillColor(...box.color);
        doc.roundedRect(bx, 34, 42, 18, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(String(box.value), bx + 21, 45, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(box.label, bx + 21, 49, { align: 'center' });
        bx += 47;
    });

    // Election-wise table
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Election-wise Participation', 14, 63);

    const partRows = elections.map(el => {
        const elVoters = voters.filter(v => v.votedIn === el.name).length;
        const elVoted = voters.filter(v => v.votedIn === el.name && v.voted).length;
        const pct = elVoters > 0 ? Math.round((elVoted / elVoters) * 100) : 0;
        const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
        return [el.name, el.status, elVoters, elVoted, elVoters - elVoted, pct + '%'];
    });

    doc.autoTable({
        startY: 66,
        head: [['Election Name', 'Status', 'Total', 'Voted', 'Not Voted', 'Rate']],
        body: partRows,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 60] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        margin: { left: 14, right: 14 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 170);
        doc.text('E-Vote Admin Portal | Participation Report | Page ' + i + ' of ' + pageCount, 14, 290);
    }

    addActivity('export', 'Participation PDF report exported');
    savePDF(doc, 'participation-report');
    showToast('Participation Report PDF exported successfully!', 'success');
}

// Export Report (Dashboard button)
function exportReport() {
    showToast('Generating Dashboard Report PDF...', 'info');
    setTimeout(() => {
        exportParticipationData();
    }, 500);
}

// Print Results
function printResults() {
    window.print();
}

// Send Bulk Email
function sendBulkEmail() {
    showToast('Bulk email feature coming soon!', 'info');
}

// Refresh Activity
function refreshActivity() {
    const btn = document.getElementById('refreshActivityBtn');
    const icon = document.getElementById('refreshIcon');

    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }
    if (icon) {
        icon.classList.add('spinning');
    }

    setTimeout(() => {
        loadRecentActivity();
        showToast('Activity refreshed', 'success');
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
        if (icon) {
            icon.classList.remove('spinning');
        }
    }, 500);
}

// Bulk Upload Candidates
function bulkUploadCandidates() {
    openBulkUploadModal();
}

// Bulk Upload Voters
function bulkUploadVoters() {
    openVoterBulkUploadModal();
}

// Open Voter Bulk Upload Modal
function openVoterBulkUploadModal() {
    const modal = document.getElementById('voterBulkUploadModal');
    const preview = document.getElementById('voterUploadPreview');
    const processBtn = document.getElementById('processVoterUploadBtn');
    const fileInput = document.getElementById('voterFileInput');

    if (preview) preview.style.display = 'none';
    if (processBtn) processBtn.disabled = true;
    if (fileInput) fileInput.value = '';
    window.uploadVoterCSVData = null;

    if (modal) modal.classList.add('show');
}

// Handle Voter File Drop
function handleVoterFileDrop(e) {
    e.preventDefault();
    const voterDropArea = document.getElementById('voterDropArea');
    if (voterDropArea) voterDropArea.style.borderColor = 'var(--border-color)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processVoterFile(files[0]);
    }
}

// Handle Voter File Select
function handleVoterFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processVoterFile(files[0]);
    }
}

// Process Voter File
function processVoterFile(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showToast('Please upload a CSV file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        previewVoterCSV(content);
    };
    reader.readAsText(file);
}

// Preview Voter CSV
function previewVoterCSV(content) {
    const preview = document.getElementById('voterUploadPreview');
    const processBtn = document.getElementById('processVoterUploadBtn');

    if (!preview || !processBtn) return;

    const lines = content.split('\n').slice(0, 5);
    let html = '<table class="preview-table">';

    lines.forEach(line => {
        if (line.trim()) {
            html += '<tr>';
            const cells = line.split(',');
            cells.forEach(cell => {
                html += `<td>${escapeHtml(cell.trim())}</td>`;
            });
            html += '</tr>';
        }
    });

    html += '</table>';

    const previewContainer = preview.querySelector('.preview-table');
    if (previewContainer) {
        previewContainer.innerHTML = html;
    }
    preview.style.display = 'block';
    processBtn.disabled = false;

    window.uploadVoterCSVData = content;
}

// Download Sample Voter CSV
function downloadSampleVoterCsv() {
    const headers = ['name', 'email', 'voterId', 'phone', 'dob', 'constituency'];
    const sampleData = [
        ['Krishna Kumar', 'krishna@example.com', 'VOTER10001', '+91 9876543211', '1990-05-15', 'North District'],
        ['Priya Sharma', 'priya@example.com', 'VOTER10002', '+91 9876543212', '1995-08-22', 'South District']
    ];

    let csv = headers.join(',') + '\n';
    sampleData.forEach(row => {
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_voters.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Process Bulk Upload Voters
function processBulkUploadVoters() {
    if (!window.uploadVoterCSVData) return;

    const lines = window.uploadVoterCSVData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        if (!row.name || !row.email) {
            skippedCount++;
            continue;
        }

        // Check for duplicate voterId or email
        const existingVoters = getVoters();
        const voterId = row.voterid || row.voterId || ('VOTER' + Date.now() + i);
        const isDuplicate = existingVoters.some(v => v.email === row.email || v.voterId === voterId);

        if (isDuplicate) {
            skippedCount++;
            continue;
        }

        const voter = {
            name: row.name,
            email: row.email,
            voterId: voterId,
            phone: row.phone || '',
            dob: row.dob || '',
            constituency: row.constituency || '',
            voted: false,
            votedIn: 'None',
            canVote: true,
            registeredDate: new Date().toISOString().split('T')[0]
        };

        addVoter(voter);
        addedCount++;
    }

    closeModal('voterBulkUploadModal');
    loadVoters();
    loadDashboard();

    if (skippedCount > 0) {
        showToast(`Added ${addedCount} voters. Skipped ${skippedCount} (duplicates/invalid).`, 'warning');
    } else {
        showToast(`Successfully added ${addedCount} voters`, 'success');
    }

    addActivity('voter', `Bulk uploaded ${addedCount} voters via CSV`);
}

// Perform Search
function performSearch(query) {
    if (!query) return;
    showToast(`Searching for "${query}"...`, 'info');
}

// Debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show Confirmation Modal
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    window.confirmAction = function () {
        onConfirm();
        closeModal('confirmModal');
    };

    if (modal) modal.classList.add('show');
}

// Handle Logout
function handleLogout() {
    showConfirmModal(
        'Logout',
        'Are you sure you want to logout?',
        () => {
            // Clear localStorage admin state
            logoutAdmin();
            // ✅ FIX: Also clear sessionStorage so login.html doesn't auto-redirect back
            if (typeof logout === 'function') logout();
            showToast('Logged out successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }
    );
}

// Show Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const icon = toast.querySelector('i:first-child');
    const messageSpan = document.getElementById('toastMessage');

    if (!icon || !messageSpan) return;

    icon.className = type === 'success' ? 'fas fa-check-circle' :
        type === 'error' ? 'fas fa-exclamation-circle' :
            type === 'warning' ? 'fas fa-exclamation-triangle' : 'fas fa-info-circle';

    toast.className = 'toast ' + type;
    messageSpan.textContent = message;
    toast.classList.add('show');

    setTimeout(() => hideToast(), 3000);
}

// Hide Toast
function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show');
}

// Pagination Functions
function nextElectionPage() {
    const elections = getElections();
    const totalPages = Math.ceil(elections.length / itemsPerPage);
    if (electionPage < totalPages) {
        electionPage++;
        loadElections();
    }
}

function prevElectionPage() {
    if (electionPage > 1) {
        electionPage--;
        loadElections();
    }
}

function nextCandidatePage() {
    const candidates = getCandidates();
    const totalPages = Math.ceil(candidates.length / 12);
    if (candidatePage < totalPages) {
        candidatePage++;
        loadCandidates();
    }
}

function prevCandidatePage() {
    if (candidatePage > 1) {
        candidatePage--;
        loadCandidates();
    }
}

function nextVoterPage() {
    const voters = getVoters();
    const totalPages = Math.ceil(voters.length / itemsPerPage);
    if (voterPage < totalPages) {
        voterPage++;
        loadVoters();
    }
}

function prevVoterPage() {
    if (voterPage > 1) {
        voterPage--;
        loadVoters();
    }
}

// Welcome Message
setTimeout(() => {
    showToast('Welcome to Admin Dashboard', 'success');
}, 500);