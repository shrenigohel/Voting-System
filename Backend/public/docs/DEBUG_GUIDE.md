# Debugging Guide - Registration & Login

## How to Debug

### Step 1: Open Browser Console
Press **F12** and go to the **Console** tab. You'll see detailed logs about what's happening.

### Step 2: Register a New User
1. Go to Register1.html
2. Fill in registration form
3. Click Register
4. Check console logs - you should see:
   ```
   📝 Registering user: {role: 'voter', email: 'test@example.com', ...}
   📋 Registration result: {success: true, user: {...}}
   ✓ Registration successful, redirecting to login...
   ```

### Step 3: Check localStorage
1. In browser DevTools (F12)
2. Go to **Application** tab
3. Click **localStorage**
4. Look for `evoting_registered_voters` or `evoting_registered_candidates`
5. You should see your registered user data

### Step 4: Login with Registered User
1. Go to login1.html
2. Check console - you should see:
   ```
   ✅ E-Voting Storage initialized
   📂 Loading persisted user data from localStorage...
   ✓ LocalStorageManager found, using it to load data...
   ✓ Loaded X registered voters/candidates from localStorage
   📊 Total voters available: X
   📊 Total candidates available: X
   ```
3. Enter your registered email and password
4. Select the correct role (Voter/Candidate)
5. Check console - you should see:
   ```
   ✓ User authenticated: {email: 'test@example.com', role: 'voter'}
   ```

---

## Common Issues & Solutions

### Issue 1: "Invalid credentials" on first login attempt after registration

**Check console for:**
```
✗ Authentication failed for: {email: '...', role: 'voter'}
Available voters: ['sample@email.com']
Available candidates: []
```

**Solution:**
- Make sure you selected the correct **role** (Voter/Candidate)
- Check spelling of email (case-sensitive)
- Verify password is correct
- Wait for the redirect to login page to complete

---

### Issue 2: Registered data not showing in localStorage

**To check:**
1. Open DevTools → Application → localStorage
2. Look for these keys:
   - `evoting_registered_voters`
   - `evoting_registered_candidates`

**If not there:**
1. Check console for errors (red messages)
2. Try registering again
3. Make sure password meets requirements:
   - At least 8 characters
   - 1 uppercase letter
   - 1 special character (!@#$%^&*etc)

**Example valid password:** `Test@123`

---

### Issue 3: Data disappears after browser close

**This is expected if:**
- Using Private/Incognito browsing mode
- Browser cache was cleared

**Solution:**
- Use normal browsing mode
- Don't clear cache/cookies

---

### Issue 4: "Email already registered" error

**This means:**
- You already registered with this email
- localStorage still has the data

**Solution (choose one):**
1. Use a different email address
2. Clear localStorage:
   - Open DevTools → Application → localStorage
   - Click on your domain
   - Right-click and delete the keys
   - Or run in console: `LocalStorageManager.clearAll();`

---

## Console Commands for Testing

### View all registered voters
```javascript
LocalStorageManager.getAllVoters()
```

### View all registered candidates
```javascript
LocalStorageManager.getAllCandidates()
```

### Check if email exists
```javascript
LocalStorageManager.voterEmailExists('test@example.com')
LocalStorageManager.candidateEmailExists('test@example.com')
```

### Clear all registered users
```javascript
LocalStorageManager.clearAll()
```

### Check EVotingStorage contents
```javascript
console.log('Voters:', EVotingStorage.voters)
console.log('Candidates:', EVotingStorage.candidates)
console.log('Admins:', EVotingStorage.admins)
```

---

## Test Scenarios

### Scenario 1: Register & Login as Voter
```
1. Register1.html → Voter tab
2. Email: testvoter@email.com
3. Password: Voter@123
4. Name: Test Voter
5. Phone: 9876543210
6. Click Register
7. Redirected to login1.html
8. Email: testvoter@email.com
9. Password: Voter@123
10. Role: Voter
11. Should see: ✓ User authenticated
```

### Scenario 2: Register & Login as Candidate
```
1. Register1.html → Candidate tab
2. Email: testcandidate@email.com
3. Password: Candidate@456
4. Name: Test Candidate
5. Phone: 9876543211
6. Party: Democratic Party
7. Click Register
8. Redirected to login1.html
9. Email: testcandidate@email.com
10. Password: Candidate@456
11. Role: Candidate
12. Should see: ✓ User authenticated
```

### Scenario 3: Login with Built-in Sample Admin
```
1. login1.html
2. Role: Admin ⚙️
3. Email: admin@gmail.com
4. Password: Admin@123
5. Click Login
6. Should redirect to admin2.html
```

---

## Expected Console Output (Success Case)

```
✅ E-Voting Storage initialized
📂 Loading persisted user data from localStorage...
✓ LocalStorageManager found, using it to load data...
✓ Loaded 1 registered voters from localStorage
📊 Total voters available: 3 (2 sample + 1 registered)
📊 Total candidates available: 2 (all sample)

[User enters credentials]

✓ User authenticated: {email: 'testvoter@email.com', role: 'voter'}
```

---

## If Still Having Issues

1. **Clear everything and start fresh:**
   ```javascript
   LocalStorageManager.clearAll();
   // Reload page
   ```

2. **Check browser compatibility:**
   - Chrome/Edge: ✓ Works
   - Firefox: ✓ Works
   - Safari: ✓ Works

3. **Open an issue with:**
   - Screenshot of console errors (red text)
   - Email and password used
   - Browser type and version
   - Whether data appears in localStorage
