# Quick Test - Registration & Login Flow

## Step-by-Step Test

### 1. Clear All Data (Fresh Start)

Open browser DevTools Console (F12) and run:

```javascript
localStorage.clear();
```

Then reload the page.

### 2. Register a New Voter

1. Go to **Register.html**
2. Click **"Voter"** tab
3. Fill form:
   - **Name**: Test User
   - **Email**: testuser@example.com
   - **Phone**: 9876543210
   - **Password**: Test@123
4. Click **"Register"**

**Check Console Output:**
You should see:

```
📝 Registering user: {role: 'voter', email: 'testuser@example.com', ...}
📋 Registration result: {success: true, user: {...}}
✓ Registration successful, redirecting to login...
✓ Voter saved to localStorage: testuser@example.com
```

### 3. Check localStorage

In DevTools (F12):

- Go to **Application** tab
- Click **localStorage**
- Look for `evoting_registered_voters`
- Should contain: `[{"email":"testuser@example.com",...}]`

### 4. Go to Login Page

1. Click the redirect or go to **login.html**
2. **Check Console Output:**

You should see:

```
✅ E-Voting Storage initialized
📂 Loading persisted user data from localStorage...
ℹ LocalStorageManager available? false (or true)
ℹ Stored voters in localStorage? true
📝 Parsed voters from localStorage: 1 voters
✓ Adding 1 new voters to EVotingStorage
  New voters: ["testuser@example.com"]
📊 Total voters available: 3 (2 sample + 1 registered)
📊 Total candidates available: 2 (sample only)
```

### 5. Login with Registered Credentials

1. Select Role: **Voter** 👤
2. Email: **testuser@example.com**
3. Password: **Test@123**
4. Click **Login**

**Check Console Output:**

```
✓ User authenticated: {email: 'testuser@example.com', role: 'voter'}
```

**Result:** Should redirect to **user.html** ✓

---

## If It Still Doesn't Work

### Issue 1: Registered data not saving

**Check:**

- Console shows error during registration?
- localStorage has `evoting_registered_voters`?
- Password is valid (8+ chars, 1 uppercase, 1 special char)?

**Fix:**

```javascript
// In console, check what's saved
localStorage.getItem("evoting_registered_voters");

// Should output something like:
// [{"email":"testuser@example.com","name":"Test User",...}]
```

### Issue 2: Data not loading at login

**Check:**

- Console shows "Stored voters in localStorage? true"?
- Console shows "Adding X new voters"?

**If it says "Stored voters in localStorage? false":**

- Data didn't save during registration
- Try registering again
- Check console for registration errors

### Issue 3: Still getting "Invalid credentials"

**Check console and verify:**

1. Is data in localStorage?

   ```javascript
   localStorage.getItem("evoting_registered_voters");
   ```

2. Is EVotingStorage loading the data?

   ```javascript
   console.log(
     "Voters:",
     EVotingStorage.voters.map((v) => v.email),
   );
   ```

3. Do passwords match exactly (case-sensitive)?
   ```javascript
   // Should find the user
   EVotingStorage.voters.find((v) => v.email === "testuser@example.com");
   ```

---

## Reset Everything

If nothing works, reset completely:

```javascript
// Clear all data
localStorage.clear();
sessionStorage.clear();

// Close browser tab and reopen
```

Then start the test over.

---

## Expected Emails in System

### Sample (Built-in) Users:

- **Voter**: krishna@gmail.com / Voter@123
- **Voter**: priya@gmail.com / Voter@123
- **Candidate**: john@evoting.com / candidate@123
- **Candidate**: alice@evoting.com / candidate@123
- **Admin**: admin@gmail.com / Admin@123

### After Registration:

- Your registered email should also work

---

## Console Log Reference

| Log                                                   | Meaning                                  |
| ----------------------------------------------------- | ---------------------------------------- |
| `✅ E-Voting Storage initialized`                     | Sample data loaded                       |
| `📂 Loading persisted user data from localStorage...` | Starting to load registered users        |
| `ℹ Stored voters in localStorage? true`               | Registered voters found                  |
| `📝 Parsed voters from localStorage: X voters`        | Successfully parsed JSON                 |
| `✓ Adding X new voters to EVotingStorage`             | Data merged into system                  |
| `📊 Total voters available: X`                        | Final count                              |
| `✓ User authenticated`                                | Login successful                         |
| `✗ Authentication failed`                             | Login failed (check email/password/role) |
