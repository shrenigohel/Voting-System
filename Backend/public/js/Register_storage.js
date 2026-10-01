//register1_storage.js
// Centralized localStorage Management for E-Voting Registration
// Ensures all registered users are persisted and retrievable

const LocalStorageManager = {
    VOTERS_KEY: 'evoting_registered_voters',
    CANDIDATES_KEY: 'evoting_registered_candidates',

    // Save voter to localStorage
    saveVoter: function (voter) {
        try {
            let voters = this.getAllVoters();
            voters.push(voter);
            localStorage.setItem(this.VOTERS_KEY, JSON.stringify(voters));
            console.log('✓ Voter saved to localStorage:', voter.email);
            return true;
        } catch (error) {
            console.error('Failed to save voter to localStorage:', error);
            return false;
        }
    },

    // Save candidate to localStorage
    saveCandidate: function (candidate) {
        try {
            let candidates = this.getAllCandidates();
            candidates.push(candidate);
            localStorage.setItem(this.CANDIDATES_KEY, JSON.stringify(candidates));
            console.log('✓ Candidate saved to localStorage:', candidate.email);
            return true;
        } catch (error) {
            console.error('Failed to save candidate to localStorage:', error);
            return false;
        }
    },

    // Get all voters from localStorage
    getAllVoters: function () {
        try {
            const voters = localStorage.getItem(this.VOTERS_KEY);
            return voters ? JSON.parse(voters) : [];
        } catch (error) {
            console.error('Failed to retrieve voters from localStorage:', error);
            return [];
        }
    },

    // Get all candidates from localStorage
    getAllCandidates: function () {
        try {
            const candidates = localStorage.getItem(this.CANDIDATES_KEY);
            return candidates ? JSON.parse(candidates) : [];
        } catch (error) {
            console.error('Failed to retrieve candidates from localStorage:', error);
            return [];
        }
    },

    // Check if voter email exists
    voterEmailExists: function (email) {
        return this.getAllVoters().some(v => v.email === email);
    },

    // Check if candidate email exists
    candidateEmailExists: function (email) {
        return this.getAllCandidates().some(c => c.email === email);
    },

    // Get voter by email
    getVoterByEmail: function (email) {
        return this.getAllVoters().find(v => v.email === email);
    },

    // Get candidate by email
    getCandidateByEmail: function (email) {
        return this.getAllCandidates().find(c => c.email === email);
    },

    // Clear all registered users (for testing)
    clearAll: function () {
        try {
            localStorage.removeItem(this.VOTERS_KEY);
            localStorage.removeItem(this.CANDIDATES_KEY);
            console.log('✓ Cleared all registered users from localStorage');
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }
};

// Register new user with localStorage persistence
function registerUser(role, userData) {
    // Validate email doesn't already exist in localStorage
    if (role === 'voter' && LocalStorageManager.voterEmailExists(userData.email)) {
        return { success: false, message: 'Email already registered as voter' };
    }

    if (role === 'candidate' && LocalStorageManager.candidateEmailExists(userData.email)) {
        return { success: false, message: 'Email already registered as candidate' };
    }

    const newUser = {
        ...userData,
        registeredDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        registeredTime: new Date().toLocaleTimeString(),
        lastLogin: null
    };

    if (role === 'voter') {
        // Generate voter ID
        const allVoters = LocalStorageManager.getAllVoters();
        newUser.id = 'V' + String(allVoters.length + 1).padStart(3, '0');
        newUser.voterId = 'VOTER' + String(allVoters.length + 100).padStart(5, '0');

        // Save to localStorage
        if (LocalStorageManager.saveVoter(newUser)) {
            // Also add to EVotingStorage for immediate access
            if (typeof EVotingStorage !== 'undefined') {
                EVotingStorage.voters.push(newUser);
            }
            console.log('✓ Voter registered successfully:', newUser);
            return { success: true, user: newUser };
        } else {
            return { success: false, message: 'Failed to register voter' };
        }
    }
    else if (role === 'candidate') {
        // Generate candidate ID
        const allCandidates = LocalStorageManager.getAllCandidates();
        newUser.id = 'C' + String(allCandidates.length + 1).padStart(3, '0');

        // Save to localStorage
        if (LocalStorageManager.saveCandidate(newUser)) {
            // Also add to EVotingStorage for immediate access
            if (typeof EVotingStorage !== 'undefined') {
                EVotingStorage.candidates.push(newUser);
            }
            console.log('✓ Candidate registered successfully:', newUser);
            return { success: true, user: newUser };
        } else {
            return { success: false, message: 'Failed to register candidate' };
        }
    }

    return { success: false, message: 'Invalid role' };
}

// Load registered users from localStorage into EVotingStorage
function loadRegisteredUsersFromStorage() {
    if (typeof EVotingStorage === 'undefined') {
        return;
    }

    try {
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
    } catch (error) {
        console.error('Failed to load registered users from localStorage:', error);
    }
}

// Initialize when script loads
console.log('✓ Register storage system initialized');