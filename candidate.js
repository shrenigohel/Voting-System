// Global variables
let currentApplicationElection = null;
let notifications = [];

// Initialize on load
document.addEventListener("DOMContentLoaded", function () {
    initializeApp();
    setupEventListeners();
});

// Initialize app
function initializeApp() {
    console.log("🚀 Initializing Candidate Dashboard...");

    checkAndLoadLoginData();
    showDashboard();
    updateCandidateInfo();
    loadDashboard();
    updateNotificationBadge();

    setTimeout(() => {
        const candidate = getCurrentCandidate();
        if (candidate) {
            showToast(
                `Welcome ${candidate.name} to your Candidate Dashboard`,
                "success",
            );
        }
    }, 500);
}

// Check and load login data
function checkAndLoadLoginData() {
    try {
        const sessionUser = sessionStorage.getItem("currentUser");
        const sessionRole = sessionStorage.getItem("currentRole");

        if (sessionUser && sessionRole === "candidate") {
            console.log("Loading candidate from session...");
            const loginData = JSON.parse(sessionUser);

            let candidate = candidateStorage.candidates.find(
                (c) => c.email === loginData.email,
            );

            if (!candidate) {
                candidate = {
                    id: "cand_" + Date.now() + Math.random().toString(36).substr(2, 9),
                    email: loginData.email,
                    password: loginData.password,
                    name: loginData.name,
                    phone: loginData.phone || "",
                    party: loginData.party || "Independent",
                    bio: loginData.bio || "",
                    image: loginData.image || "",
                    registrationDate:
                        loginData.registeredDate || new Date().toISOString().split("T")[0],
                    verified: true,
                    lastUpdated: new Date().toISOString(),
                };

                candidateStorage.candidates.push(candidate);
                candidateStorage.saveToLocalStorage();
                console.log("Created candidate from session:", candidate.email);
            }

            setCurrentCandidate(candidate);
            console.log("✅ Candidate loaded from session:", candidate.name);
            return true;
        }

        const tempCandidate = sessionStorage.getItem("tempRegisteredCandidate");
        if (tempCandidate) {
            console.log("Found newly registered candidate");
            const newCandidate = JSON.parse(tempCandidate);
            sessionStorage.removeItem("tempRegisteredCandidate");
            saveCandidate(newCandidate);
            showToast(
                `Welcome ${newCandidate.name}! Your candidate dashboard is ready.`,
                "success",
            );
            return true;
        }

        console.log("No login data found, using default candidate");
        return false;
    } catch (error) {
        console.error("Error checking login data:", error);
        return false;
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById("dashboardScreen").style.display = "block";
}

// Generic function to close any modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const page = this.dataset.page;
            navigateTo(page);
        });
    });

    // Status filter
    const electionFilter = document.getElementById("electionStatusFilter");
    if (electionFilter) {
        electionFilter.addEventListener("change", filterElections);
    }

    // Password input listeners
    document
        .getElementById("newPassword")
        ?.addEventListener("input", function () {
            updatePasswordStrength(this.value);
            checkPasswordMatch();
        });

    document
        .getElementById("confirmPassword")
        ?.addEventListener("input", checkPasswordMatch);
    document
        .getElementById("currentPassword")
        ?.addEventListener("input", validateChangePasswordForm);

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        const profileMenu = document.querySelector(".nav-profile");
        const dropdown = document.getElementById("profileDropdown");

        if (profileMenu && dropdown && !profileMenu.contains(e.target)) {
            dropdown.classList.remove("show");
        }

        if (e.target.classList.contains("modal-backdrop")) {
            document.querySelectorAll(".modal").forEach((modal) => {
                modal.classList.remove("show");
            });
        }
    });
}

// Toggle mobile menu
function toggleMobileMenu() {
    const navMenu = document.getElementById("navMenu");
    const toggleBtn = document.querySelector(".mobile-menu-toggle i");

    navMenu.classList.toggle("mobile-show");

    if (navMenu.classList.contains("mobile-show")) {
        toggleBtn.className = "fas fa-times";
    } else {
        toggleBtn.className = "fas fa-bars";
    }
}

// Close mobile menu when clicking outside
document.addEventListener("click", function (e) {
    const navMenu = document.getElementById("navMenu");
    const toggleBtn = document.querySelector(".mobile-menu-toggle");

    if (
        navMenu &&
        toggleBtn &&
        !navMenu.contains(e.target) &&
        !toggleBtn.contains(e.target)
    ) {
        navMenu.classList.remove("mobile-show");
        const toggleIcon = document.querySelector(".mobile-menu-toggle i");
        if (toggleIcon) {
            toggleIcon.className = "fas fa-bars";
        }
    }
});

// Update candidate info
function updateCandidateInfo() {
    const candidate = getCurrentCandidate();
    if (!candidate) return;

    const firstName = candidate.name.split(" ")[0];

    document.getElementById("userName").textContent = candidate.name;
    document.getElementById("profileName").textContent = candidate.name;
    document.getElementById("profileEmail").textContent = candidate.email;
    document.getElementById("welcomeName").textContent = firstName;

    const profileStatus = document.getElementById("profileStatus");
    if (profileStatus) {
        if (candidate.lastUpdated) {
            const lastUpdated = new Date(candidate.lastUpdated);
            const now = new Date();
            const daysDiff = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                profileStatus.textContent = "Updated today";
                profileStatus.className = "profile-status updated";
            } else if (daysDiff === 1) {
                profileStatus.textContent = "Updated yesterday";
                profileStatus.className = "profile-status updated";
            } else if (daysDiff < 7) {
                profileStatus.textContent = `Updated ${daysDiff} days ago`;
                profileStatus.className = "profile-status updated";
            } else {
                profileStatus.textContent = `Last updated: ${lastUpdated.toLocaleDateString()}`;
                profileStatus.className = "profile-status";
            }
        } else {
            profileStatus.textContent = "Profile not updated yet";
            profileStatus.className = "profile-status";
        }
    }

    const welcomeInfo = document.getElementById("profileWelcomeInfo");
    if (welcomeInfo && candidate.party) {
        welcomeInfo.textContent = `Party: ${candidate.party} | Registered: ${candidate.registrationDate}`;
    }

    const initials = candidate.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);

    document.getElementById("avatarInitials").textContent = initials;
    document.getElementById("avatarInitialsLarge").textContent = initials;

    if (candidate.image) {
        const avatar = document.getElementById("avatarInitials");
        const avatarLarge = document.getElementById("avatarInitialsLarge");
        avatar.style.backgroundImage = `url('${candidate.image}')`;
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.style.color = "transparent";

        avatarLarge.style.backgroundImage = `url('${candidate.image}')`;
        avatarLarge.style.backgroundSize = "cover";
        avatarLarge.style.backgroundPosition = "center";
        avatarLarge.style.color = "transparent";
    }
}

// Update notification badge
function updateNotificationBadge() {
    const candidate = getCurrentCandidate();
    if (!candidate) return;

    const unreadCount = getUnreadNotificationCount(candidate.email);
    const badge = document.getElementById("notificationCount");
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? "block" : "none";
    }
}

// Toggle notifications
function toggleNotifications() {
    const candidate = getCurrentCandidate();
    if (!candidate) return;

    const notifications = getCandidateNotifications(candidate.email);
    const unreadNotifications = notifications.filter((n) => !n.read);

    if (unreadNotifications.length > 0) {
        markAllNotificationsAsRead(candidate.email);
        updateNotificationBadge();
        showToast("All notifications marked as read!", "success");
    } else {
        showToast("No new notifications", "info");
    }
}

// Toggle profile dropdown
function toggleProfile() {
    const dropdown = document.getElementById("profileDropdown");
    dropdown.classList.toggle("show");
}

// Navigate to page
function navigateTo(page) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.classList.remove("active");
        if (btn.dataset.page === page) {
            btn.classList.add("active");
        }
    });

    document.querySelectorAll(".page").forEach((p) => {
        p.classList.remove("active");
    });

    const targetId = page + "Page";
    const targetPage = document.getElementById(targetId);
    if (targetPage) {
        targetPage.classList.add("active");
        loadPageData(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const navMenu = document.getElementById("navMenu");
    if (navMenu && navMenu.classList.contains("mobile-show")) {
        navMenu.classList.remove("mobile-show");
        const toggleIcon = document.querySelector(".mobile-menu-toggle i");
        if (toggleIcon) {
            toggleIcon.className = "fas fa-bars";
        }
    }
}

// Load page data
function loadPageData(page) {
    switch (page) {
        case "dashboard":
            loadDashboard();
            break;
        case "elections":
            loadElectionsPage();
            break;
        case "applications":
            loadApplicationsPage();
            break;
        case "analytics":
            loadAnalyticsPage();
            break;
        case "results":
            loadResultsPage();
            break;
    }
}

// Load dashboard with enhanced stats
function loadDashboard() {
    const candidate = getCurrentCandidate();
    if (!candidate) return;

    const stats = getCandidateStats(candidate.email);

    // Update main stats
    document.getElementById("activeElectionsCount").textContent =
        stats.activeElections;
    document.getElementById("applicationsCount").textContent = stats.applications;
    document.getElementById("totalVotesCount").textContent =
        stats.totalVotes.toLocaleString();
    document.getElementById("wonElectionsCountStat").textContent =
        stats.wonElections;

    // Update hero stats
    document.getElementById("activeCampaignsCount").textContent =
        stats.activeElections;
    document.getElementById("wonElectionsCount").textContent = stats.wonElections;

    // Update trend percentages
    document.getElementById("activeTrend").textContent =
        stats.trends.activeElections;
    document.getElementById("applicationTrend").textContent =
        stats.trends.applications;
    document.getElementById("voteTrend").textContent = stats.trends.totalVotes;
    document.getElementById("wonTrend").textContent = stats.trends.wonElections;

    // Update trend icons based on values
    updateTrendIcons(stats.trends);

    loadActiveCampaigns();
    loadPerformanceOverview();
    loadActivityTimeline();
}

// Update trend icons based on values
function updateTrendIcons(trends) {
    const trendElements = document.querySelectorAll(".stat-trend i");

    trendElements.forEach((icon, index) => {
        const parent = icon.parentElement;
        const trendSpan = parent.querySelector("span");
        if (!trendSpan) return;

        const trendValue = parseFloat(trendSpan.textContent);

        if (trendValue > 0) {
            icon.className = "fas fa-arrow-up";
            parent.classList.add("up");
            parent.classList.remove("down");
        } else if (trendValue < 0) {
            icon.className = "fas fa-arrow-down";
            parent.classList.add("down");
            parent.classList.remove("up");
        } else {
            icon.className = "fas fa-minus";
            parent.classList.remove("up", "down");
        }
    });
}

// Load active campaigns
function loadActiveCampaigns() {
    const candidate = getCurrentCandidate();
    const applications = getCandidateApplications(candidate.email).filter(
        (app) => app.status === "approved",
    );
    const container = document.getElementById("activeCampaignsList");

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-fire"></i>
                <h3>No Active Campaigns</h3>
                <p>Apply for elections to start your campaign</p>
                <button class="btn-primary mt-3" onclick="navigateTo('elections')">
                    <i class="fas fa-search"></i> Browse Elections
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    applications.slice(0, 4).forEach((app) => {
        const election = getElectionById(app.electionId);
        if (!election) return;

        const item = document.createElement("div");
        item.className = "campaign-item";
        item.innerHTML = `
            <div class="campaign-header">
                <h4>${election.name}</h4>
                <span class="badge success">Active</span>
            </div>
            <div style="display: flex; gap: 1.5rem; color: var(--gray-600); font-size: 0.9rem;">
                <span><i class="fas fa-calendar"></i> Ends: ${election.endDate}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${election.areas}</span>
            </div>
        `;
        item.onclick = () => navigateTo("elections");
        container.appendChild(item);
    });
}

// Load performance overview
function loadPerformanceOverview() {
    const candidate = getCurrentCandidate();
    const votes = getCandidateVotes(candidate.email);
    const container = document.getElementById("performanceOverview");

    if (votes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <h3>No Data Available</h3>
                <p>Start participating in elections to see performance metrics</p>
            </div>
        `;
        return;
    }

    const totalVotes = votes.reduce((sum, v) => sum + (v.votes || 0), 0);
    const avgVoteShare =
        votes.reduce((sum, v) => sum + (v.percentage || 0), 0) / votes.length;

    container.innerHTML = `
        <div class="vote-stats">
            <div class="vote-stat">
                <h4>${totalVotes.toLocaleString()}</h4>
                <p>Total Votes</p>
            </div>
            <div class="vote-stat">
                <h4>${avgVoteShare.toFixed(1)}%</h4>
                <p>Average Vote Share</p>
            </div>
            <div class="vote-stat">
                <h4>${votes.length}</h4>
                <p>Participated Elections</p>
            </div>
            <div class="vote-stat">
                <h4>#${votes.length > 0 ? votes[0].rank || "1" : "-"}</h4>
                <p>Best Ranking</p>
            </div>
        </div>
    `;
}

// Load activity timeline
function loadActivityTimeline() {
    const container = document.getElementById("activityTimeline");
    const candidate = getCurrentCandidate();
    const applications = getCandidateApplications(candidate.email);

    let activities = [];

    applications.forEach((app) => {
        const election = getElectionById(app.electionId);
        if (election) {
            activities.push({
                icon: "file-contract",
                title: `Application ${app.status === "approved" ? "Approved" : app.status === "pending" ? "Submitted" : "Rejected"}`,
                description: `${election.name}`,
                time: `${app.appliedDate}`,
            });
        }
    });

    if (candidate.lastUpdated) {
        const lastUpdated = new Date(candidate.lastUpdated);
        const now = new Date();
        const hoursDiff = (now - lastUpdated) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
            activities.unshift({
                icon: "user-edit",
                title: "Profile Updated",
                description: "Your profile information was updated",
                time: hoursDiff < 1 ? "Just now" : `${Math.floor(hoursDiff)} hours ago`,
            });
        }
    }

    if (activities.length === 0) {
        activities = [
            {
                icon: "vote-yea",
                title: "Welcome to Candidate Portal",
                description:
                    "Start by browsing available elections and applying to participate",
                time: "Just now",
            },
            {
                icon: "user-check",
                title: "Profile Setup Complete",
                description: "Your candidate profile has been successfully created",
                time: "Today",
            },
        ];
    }

    container.innerHTML = "";
    activities.slice(0, 5).forEach((activity) => {
        const item = document.createElement("div");
        item.className = "activity-item";
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

// Load elections page
function loadElectionsPage() {
    const elections = getElections();
    displayElections(elections);
}

// Filter elections
function filterElections() {
    const filterValue = document.getElementById("electionStatusFilter").value;
    const elections = getElections();

    if (filterValue === "all") {
        displayElections(elections);
    } else {
        const filtered = elections.filter((e) => e.status === filterValue);
        displayElections(filtered);
    }
}

// Display elections
function displayElections(elections) {
    const container = document.getElementById("electionsGrid");
    const candidate = getCurrentCandidate();

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

    container.innerHTML = "";
    elections.forEach((election) => {
        const hasApplied = hasAppliedForElection(candidate.email, election.id);
        const badgeClass =
            election.status === "Open"
                ? "success"
                : election.status === "Upcoming"
                    ? "warning"
                    : "danger";

        const card = document.createElement("div");
        card.className = "election-card";
        card.innerHTML = `
            <div class="election-header">
                <h3>${election.name}</h3>
                <span class="badge ${badgeClass}">${election.status}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; color: var(--gray-600); font-size: 0.9rem; margin-bottom: 1.5rem;">
                <div><i class="fas fa-calendar"></i> ${election.startDate} - ${election.endDate}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${election.areas}</div>
                <div><i class="fas fa-users"></i> ${election.candidates.length} candidates</div>
            </div>
            ${election.status === "Upcoming" && !hasApplied
                ? `<button class="btn-primary" onclick="openApplicationModal(${election.id})">
                    <i class="fas fa-file-contract"></i> Apply Now
                   </button>`
                : hasApplied
                    ? '<button class="btn-secondary" disabled><i class="fas fa-check-circle"></i> Applied</button>'
                    : election.status === "Open"
                        ? '<button class="btn-secondary" disabled><i class="fas fa-hourglass-half"></i> Registration Closed</button>'
                        : '<button class="btn-secondary" disabled><i class="fas fa-calendar-times"></i> Completed</button>'
            }
        `;
        container.appendChild(card);
    });
}

// Load applications page
function loadApplicationsPage() {
    const candidate = getCurrentCandidate();
    const applications = getCandidateApplications(candidate.email);
    const container = document.getElementById("applicationsList");

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-contract"></i>
                <h3>No Applications Yet</h3>
                <p>Browse elections and apply to get started</p>
                <button class="btn-primary mt-3" onclick="navigateTo('elections')">
                    <i class="fas fa-search"></i> Browse Elections
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    applications.forEach((app) => {
        const election = getElectionById(app.electionId);
        if (!election) return;

        const statusClass =
            app.status === "approved"
                ? "success"
                : app.status === "pending"
                    ? "warning"
                    : "danger";
        const statusText = app.status.charAt(0).toUpperCase() + app.status.slice(1);

        const card = document.createElement("div");
        card.className = "application-card";
        card.innerHTML = `
            <div class="application-header">
                <h3>${election.name}</h3>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <div class="application-info-grid">
                <div class="info-item">
                    <span class="info-label">Applied On</span>
                    <span class="info-value">${app.appliedDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Election Date</span>
                    <span class="info-value">${election.startDate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Areas</span>
                    <span class="info-value">${election.areas}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Application ID</span>
                    <span class="info-value">#${app.id.slice(-6).toUpperCase()}</span>
                </div>
            </div>
            ${app.reason ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);"><strong>Reason:</strong> ${app.reason}</div>` : ""}
            ${app.status === "pending"
                ? '<div style="margin-top: 1rem; color: var(--warning);"><i class="fas fa-info-circle"></i> Your application is under review</div>'
                : ""
            }
        `;
        container.appendChild(card);
    });
}

// Load analytics page
function loadAnalyticsPage() {
    const candidate = getCurrentCandidate();
    const votes = getCandidateVotes(candidate.email);
    const container = document.getElementById("voteTrends");

    if (votes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h3>No Vote Data Available</h3>
                <p>Vote data will appear once elections are completed</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    votes.forEach((vote) => {
        const percentage =
            vote.totalVotes > 0
                ? ((vote.votes / vote.totalVotes) * 100).toFixed(1)
                : 0;

        const div = document.createElement("div");
        div.className = "campaign-item";
        div.innerHTML = `
            <div class="campaign-header">
                <h4>${vote.electionName}</h4>
                <span class="badge ${vote.percentage > 50 ? "success" : "warning"}">${percentage}% Share</span>
            </div>
            <div class="vote-stats">
                <div class="vote-stat">
                    <h4>${vote.votes.toLocaleString()}</h4>
                    <p>Your Votes</p>
                </div>
                <div class="vote-stat">
                    <h4>${vote.totalVotes.toLocaleString()}</h4>
                    <p>Total Votes</p>
                </div>
                <div class="vote-stat">
                    <h4>${percentage}%</h4>
                    <p>Vote Share</p>
                </div>
                <div class="vote-stat">
                    <h4>#${vote.rank || "N/A"}</h4>
                    <p>Rank</p>
                </div>
            </div>
            <div style="margin-top: 1rem;">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Load results page
function loadResultsPage() {
    const candidate = getCurrentCandidate();
    const results = getCandidateResults(candidate.email);
    const container = document.getElementById("resultsGrid");

    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-poll"></i>
                <h3>No Results Yet</h3>
                <p>Election results will appear here once declared</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    results.forEach((result) => {
        const badgeClass = result.won ? "success" : "danger";
        const badgeText = result.won ? "Won" : "Lost";

        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `
            <div class="result-header">
                <h3>${result.electionName}</h3>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="vote-stats">
                <div class="vote-stat">
                    <h4>${result.votes.toLocaleString()}</h4>
                    <p>Your Votes</p>
                </div>
                <div class="vote-stat">
                    <h4>${result.totalVotes.toLocaleString()}</h4>
                    <p>Total Votes</p>
                </div>
                <div class="vote-stat">
                    <h4>${result.percentage}%</h4>
                    <p>Vote Share</p>
                </div>
                <div class="vote-stat">
                    <h4>#${result.rank}</h4>
                    <p>Rank</p>
                </div>
            </div>
            <div style="margin-top: 1rem;">
                <div style="font-size: 0.875rem; color: var(--gray-600);">Result Declared On</div>
                <div style="font-weight: 600; color: var(--gray-800);">${result.declaredDate}</div>
            </div>
            ${result.won
                ? '<div style="margin-top: 1rem; padding: 1rem; background: var(--success-light); border-radius: 8px; color: #065f46;"><i class="fas fa-trophy"></i> <strong>Congratulations!</strong> You won this election.</div>'
                : '<div style="margin-top: 1rem; padding: 1rem; background: var(--gray-100); border-radius: 8px;"><i class="fas fa-info-circle"></i> Better luck next time!</div>'
            }
        `;
        container.appendChild(card);
    });
}

// Open application modal
function openApplicationModal(electionId) {
    currentApplicationElection = electionId;
    const election = getElectionById(electionId);

    const infoContainer = document.getElementById("applicationInfo");
    infoContainer.innerHTML = `
        <div class="campaign-item">
            <div class="campaign-header">
                <h4>${election.name}</h4>
                <span class="badge ${election.status === "Open" ? "success" : "warning"}">${election.status}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; color: var(--gray-600); font-size: 0.9rem;">
                <div><i class="fas fa-calendar"></i> ${election.startDate} - ${election.endDate}</div>
                <div><i class="fas fa-map-marker-alt"></i> ${election.areas}</div>
                <div><i class="fas fa-users"></i> ${election.candidates.length} registered candidates</div>
            </div>
        </div>
    `;

    document.getElementById("applicationReason").value = "";
    document.getElementById("applicationManifesto").value = "";
    document.getElementById("termsCheckbox").checked = false;
    document.getElementById("applicationModal").classList.add("show");
}

// Close application modal
function closeApplicationModal() {
    document.getElementById("applicationModal").classList.remove("show");
    currentApplicationElection = null;
}

// Submit application
function submitApplication() {
    const reason = document.getElementById("applicationReason").value.trim();
    const manifesto = document
        .getElementById("applicationManifesto")
        .value.trim();
    const termsAccepted = document.getElementById("termsCheckbox").checked;

    if (!reason) {
        showToast("Please provide a reason for your application", "error");
        return;
    }

    if (!termsAccepted) {
        showToast("Please accept the terms and conditions", "error");
        return;
    }

    const candidate = getCurrentCandidate();
    const election = getElectionById(currentApplicationElection);

    const application = {
        electionId: currentApplicationElection,
        candidateId: candidate.id,
        candidateEmail: candidate.email,
        candidateName: candidate.name,
        party: candidate.party || "Independent",
        reason: reason,
        manifesto: manifesto,
        appliedDate: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }),
        status: "pending",
    };

    if (saveCandidateApplication(application)) {
        addNotification({
            candidateEmail: candidate.email,
            title: "Application Submitted",
            message: `Your application for ${election.name} has been submitted successfully.`,
            type: "success",
            date: new Date().toISOString().split("T")[0],
            read: false,
        });

        updateNotificationBadge();
        showToast(
            "Application submitted successfully! It is now under review.",
            "success",
        );
        closeApplicationModal();
        loadElectionsPage();
        loadApplicationsPage();
        loadDashboard();
    } else {
        showToast("You have already applied for this election", "warning");
    }
}

// Open edit profile modal
function openEditProfileModal() {
    const candidate = getCurrentCandidate();
    document.getElementById("editName").value = candidate.name;
    document.getElementById("editEmail").value = candidate.email;
    document.getElementById("editPhone").value = candidate.phone || "";
    document.getElementById("editParty").value = candidate.party || "";
    document.getElementById("editBio").value = candidate.bio || "";
    document.getElementById("editImage").value = candidate.image || "";
    document.getElementById("editProfileModal").classList.add("show");
    toggleProfile();
}

// Close edit profile modal
function closeEditProfileModal() {
    document.getElementById("editProfileModal").classList.remove("show");
}

// Save profile
function saveProfile() {
    const candidate = getCurrentCandidate();
    const newName = document.getElementById("editName").value.trim();
    const newEmail = document.getElementById("editEmail").value.trim();
    const newPhone = document.getElementById("editPhone").value.trim();
    const newParty = document.getElementById("editParty").value.trim();
    const newBio = document.getElementById("editBio").value.trim();
    const newImage = document.getElementById("editImage").value.trim();

    if (!newName || !newEmail) {
        showToast("Name and Email are required!", "error");
        return;
    }

    if (newEmail !== candidate.email) {
        const existingCandidate = getCandidateByEmail(newEmail);
        if (existingCandidate && existingCandidate.email !== candidate.email) {
            showToast("This email is already registered", "error");
            return;
        }
    }

    candidate.name = newName;
    candidate.email = newEmail;
    candidate.phone = newPhone;
    candidate.party = newParty;
    candidate.bio = newBio;
    if (newImage) {
        candidate.image = newImage;
    }

    saveCandidate(candidate);
    updateCandidateInfo();
    closeEditProfileModal();

    const updateStatus = document.getElementById("profileUpdateStatus");
    if (updateStatus) {
        updateStatus.style.display = "flex";
        setTimeout(() => {
            updateStatus.style.display = "none";
        }, 3000);
    }

    showToast("Profile updated successfully!", "success");
    loadDashboard(); // Refresh dashboard stats
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

    segments.forEach((segment) => {
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
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    document.getElementById("passwordStrengthContainer").style.display = "none";
    document.getElementById("passwordMatch").style.display = "none";
    document.getElementById("passwordMismatch").style.display = "none";
    document.getElementById("savePasswordBtn").disabled = true;

    document.getElementById("changePasswordModal").classList.add("show");
    toggleProfile();
}

// Close change password modal
function closeChangePasswordModal() {
    document.getElementById("changePasswordModal").classList.remove("show");
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
    showToast(
        "Password changed successfully! You will be logged out in 3 seconds...",
        "success",
    );

    setTimeout(() => {
        if (
            confirm(
                "Password changed successfully! Please login again with your new password.",
            )
        ) {
            logoutCandidate();
            window.location.href = "login.html";
        }
    }, 3000);
}

// Handle logout
function handleLogout() {
    // Show the custom modal instead of logging out instantly
    document.getElementById("confirmModal").classList.add("show");
}

function confirmLogout() {
    // Hide the modal
    document.getElementById("confirmModal").classList.remove("show");

    // Actually log the candidate out
    if (typeof logoutCandidate === "function") {
        logoutCandidate();
    } else {
        sessionStorage.removeItem("currentUser");
        sessionStorage.removeItem("currentRole");
    }

    // Redirect to login
    window.location.href = "login.html";
}

// Show toast
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const icon = toast.querySelector("i");
    const messageSpan = document.getElementById("toastMessage");

    switch (type) {
        case "success":
            icon.className = "fas fa-check-circle";
            toast.classList.add("success");
            toast.classList.remove("error");
            break;
        case "error":
            icon.className = "fas fa-exclamation-circle";
            toast.classList.add("error");
            toast.classList.remove("success");
            break;
        case "warning":
            icon.className = "fas fa-exclamation-triangle";
            toast.classList.add("error");
            toast.classList.remove("success");
            break;
        case "info":
            icon.className = "fas fa-info-circle";
            toast.classList.add("success");
            toast.classList.remove("error");
            break;
        default:
            icon.className = "fas fa-info-circle";
    }

    messageSpan.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
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
window.openApplicationModal = openApplicationModal;
window.closeApplicationModal = closeApplicationModal;
window.submitApplication = submitApplication;
window.filterElections = filterElections;
window.handleLogout = handleLogout;
window.closeModal = closeModal;
window.confirmLogout = confirmLogout;