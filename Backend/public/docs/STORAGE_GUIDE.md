# E-Voting System - localStorage Guide

## Overview

The e-voting system now uses **localStorage** to persist user registration data. This ensures that when users register as voters or candidates, their information is saved and available for login across browser sessions.

## How It Works

### Registration Flow (Register.html)

1. User fills registration form (email, password, name, etc.)
2. `handleRegister()` in Register1.js validates the input
3. `registerUser()` in Register1_storage.js is called
4. Data is saved to localStorage using `LocalStorageManager`
5. User gets success message and redirected to login

### Storage Keys

- **Voters**: `evoting_registered_voters` (localStorage)
- **Candidates**: `evoting_registered_candidates` (localStorage)
- **Admins**: Stored in memory (sample data only)

### Login Flow (login.html)

1. Page loads and executes `login_storage.js`
2. `loadPersistedUserData()` retrieves registered users from localStorage
3. Registered users are merged into `EVotingStorage` arrays
4. User enters credentials and selects role
5. `authenticateUser()` searches both sample data and registered users
6. If match found → user is logged in and redirected

## File Structure

```
Register1_storage.js
├── LocalStorageManager (object)
│   ├── saveVoter() - Saves voter to localStorage
│   ├── saveCandidate() - Saves candidate to localStorage
│   ├── getAllVoters() - Retrieves all voters from localStorage
│   ├── getAllCandidates() - Retrieves all candidates from localStorage
│   ├── voterEmailExists() - Checks if voter email exists
│   └── candidateEmailExists() - Checks if candidate email exists
│
└── registerUser() - Main registration function
    └── Calls LocalStorageManager methods to persist data

login1_storage.js
├── EVotingStorage.init() - Initializes with sample data
└── loadPersistedUserData() - Loads registered users from localStorage
```

## Sample Test Cases

### Test Case 1: Register & Login as Voter

```
1. Go to Register.html
2. Select "Voter" tab
3. Fill form:
   - Name: John Voter
   - Email: john@voter.com
   - Phone: 9876543210
   - Password: Voter@123
4. Click "Register"
5. Redirected to login
6. Enter same email and password
7. Should login successfully ✓
```

### Test Case 2: Register & Login as Candidate

```
1. Go to Register.html
2. Select "Candidate" tab
3. Fill form:
   - Name: Jane Candidate
   - Email: jane@candidate.com
   - Phone: 9876543211
   - Password: Candidate@456
   - Party: Democratic Party
4. Click "Register"
5. Redirected to login
6. Enter same email and password
7. Should login successfully ✓
```

### Test Case 3: Admin Login (Built-in Sample)

```
Email: admin@gmail.com
Password: Admin@123
Role: Admin ⚙️
```

### Test Case 4: Voter Login (Built-in Sample)

```
Email: krishna@gmail.com
Password: Voter@123
Role: Voter
```

### Test Case 5: Candidate Login (Built-in Sample)

```
Email: john@evoting.com
Password: candidate@123
Role: Candidate
```

## Data Persistence

### What Gets Stored

- ✓ Email
- ✓ Password
- ✓ Name
- ✓ Phone
- ✓ Registration Date
- ✓ Registration Time
- ✓ Party (for candidates)
- ✓ Generated ID (voter/candidate ID)

### Browser Storage Size

- localStorage: ~5-10MB per domain
- This can store thousands of user records

### Important Notes

- Data is stored in **browser's localStorage**
- Clearing browser cache/cookies will delete stored data
- Data is NOT shared between browsers
- Each device has its own localStorage

## Testing localStorage Content

Open browser Developer Tools (F12) → Application → localStorage → and look for:

- `evoting_registered_voters`
- `evoting_registered_candidates`

## Troubleshooting

### Issue: "Invalid credentials" after registration

**Solution**:

1. Check browser console for errors (F12)
2. Verify localStorage has data (Application → localStorage)
3. Ensure you selected the correct role (Voter/Candidate)
4. Clear browser cache and try again

### Issue: Registered data disappears after browser restart

**Solution**: This is expected if using Private/Incognito mode. Use normal browsing mode.

### Issue: Register button not working

**Solution**:

1. Check password requirements: 8+ characters, 1 uppercase, 1 special character
2. Check email format
3. Check phone is 10 digits

## Advanced: Clearing Data

To clear all registered users, open browser console and run:

```javascript
LocalStorageManager.clearAll();
```

This will clear registered voters and candidates from localStorage while keeping sample data intact.
