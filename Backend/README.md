# 🗳️ Online E-Voting System — Complete REST API

## Tech Stack
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** Authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

---

## 📁 Project Structure

```
backend/
├── server.js                  # Entry point
├── .env.example               # Environment variables template
├── package.json
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js                # Voter & Admin schema
│   ├── Election.js            # Election schema
│   ├── Candidate.js           # Candidate schema
│   └── Vote.js                # Vote record schema
├── middleware/
│   ├── authMiddleware.js      # JWT protect, adminOnly, optionalAuth
│   └── validateMiddleware.js  # express-validator error handler
├── controllers/
│   ├── authController.js      # register, login, profile, password
│   ├── userController.js      # Admin CRUD for users
│   ├── electionController.js  # Election lifecycle management
│   ├── candidateController.js # Candidate CRUD
│   ├── voteController.js      # Cast vote, verify, history
│   ├── resultController.js    # Results, live stats, winner
│   └── adminController.js     # Dashboard, vote audit
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── electionRoutes.js
│   ├── candidateRoutes.js
│   ├── voteRoutes.js
│   ├── resultRoutes.js
│   └── adminRoutes.js
└── utils/
    └── tokenUtils.js          # JWT generation helpers
```

---

## ⚙️ Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Then edit .env with your values

# 3. Start the server
npm start          # production
npm run dev        # development (nodemon)
```

### .env variables
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/voting_system
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 🔐 Authentication

All protected routes require a Bearer token in the header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned on **register** and **login**.

---

## 📋 Complete API Reference

### 🔑 Auth — `/api/auth`

| Method | Endpoint                   | Auth    | Description                  |
|--------|----------------------------|---------|------------------------------|
| POST   | `/register`                | Public  | Register a new voter         |
| POST   | `/login`                   | Public  | Login and get JWT token      |
| GET    | `/me`                      | Voter   | Get logged-in user profile   |
| PUT    | `/update-profile`          | Voter   | Update name, phone, address  |
| PUT    | `/change-password`         | Voter   | Change password              |
| POST   | `/logout`                  | Voter   | Logout (client clears token) |

#### POST `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "voterId": "VTR-001",      // optional
  "phone": "9876543210",     // optional
  "address": "Gujarat, India" // optional
}
```

#### POST `/api/auth/login`
```json
{ "email": "john@example.com", "password": "secret123" }
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": { "_id": "...", "name": "John Doe", "role": "voter", ... }
}
```

---

### 👥 Users — `/api/users` *(Admin only)*

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | List all users (paginated + search)  |
| GET    | `/:id`                | Get single user                      |
| PUT    | `/:id`                | Update user fields                   |
| DELETE | `/:id`                | Delete user                          |
| PUT    | `/:id/toggle-status`  | Activate / deactivate user           |
| PUT    | `/:id/reset-vote`     | Reset voter's hasVoted flag          |

**Query params for GET `/`:**  
`?page=1&limit=20&role=voter&search=john&isActive=true`

---

### 🗓️ Elections — `/api/elections`

| Method | Endpoint        | Auth    | Description                      |
|--------|-----------------|---------|----------------------------------|
| GET    | `/`             | Public  | List all published elections     |
| GET    | `/:id`          | Public  | Get single election              |
| POST   | `/`             | Admin   | Create new election              |
| PUT    | `/:id`          | Admin   | Update election details          |
| DELETE | `/:id`          | Admin   | Delete election (not if active)  |
| PUT    | `/:id/start`    | Admin   | Set status → active              |
| PUT    | `/:id/end`      | Admin   | Set status → ended               |
| PUT    | `/:id/publish`  | Admin   | Publish election to voters       |

#### POST `/api/elections` (Admin)
```json
{
  "title": "Student Union Election 2025",
  "description": "Annual student body election",
  "startDate": "2025-06-01T09:00:00Z",
  "endDate": "2025-06-01T17:00:00Z"
}
```

**Election Status Flow:**
```
upcoming  ──[start]──▶  active  ──[end]──▶  ended
```

---

### 🧑‍💼 Candidates — `/api/candidates`

| Method | Endpoint  | Auth   | Description                          |
|--------|-----------|--------|--------------------------------------|
| GET    | `/`       | Public | List candidates (?electionId=...)    |
| GET    | `/:id`    | Public | Get single candidate                 |
| POST   | `/`       | Admin  | Add candidate to an election         |
| PUT    | `/:id`    | Admin  | Update candidate info                |
| DELETE | `/:id`    | Admin  | Delete candidate (not if active)     |

#### POST `/api/candidates` (Admin)
```json
{
  "name": "Amit Shah",
  "party": "Progressive Party",
  "bio": "10 years in student council...",
  "electionId": "664abc...",
  "symbol": "🌟",
  "position": "President",
  "image": "https://example.com/amit.jpg"
}
```

---

### 🗳️ Voting — `/api/vote`

| Method | Endpoint               | Auth   | Description                            |
|--------|------------------------|--------|----------------------------------------|
| POST   | `/`                    | Voter  | Cast a vote                            |
| GET    | `/my-votes`            | Voter  | View all my past votes                 |
| GET    | `/status/:electionId`  | Voter  | Check if I voted in this election      |
| GET    | `/verify/:hash`        | Public | Verify a vote by its audit hash        |

#### POST `/api/vote` (Voter)
```json
{
  "electionId": "664abc...",
  "candidateId": "664def..."
}
```
**Response:**
```json
{
  "success": true,
  "message": "Your vote has been recorded successfully.",
  "voteHash": "a3f5b9c1d2e4..."
}
```
> The `voteHash` is a unique audit token. Voters can use it to verify their vote was counted at `GET /api/vote/verify/:hash`.

---

### 📊 Results — `/api/results`

| Method | Endpoint                  | Auth   | Description                           |
|--------|---------------------------|--------|---------------------------------------|
| GET    | `/`                       | Public | All ended elections with winners      |
| GET    | `/:electionId`            | Public | Full ranked results (ended elections) |
| GET    | `/:electionId/live`       | Admin  | Live vote counts with timeline        |

#### GET `/api/results/:electionId` Response
```json
{
  "success": true,
  "election": { "title": "...", "status": "ended", "totalVotes": 150 },
  "winner": { "rank": 1, "name": "Amit Shah", "party": "...", "votes": 95, "percentage": "63.33" },
  "results": [
    { "rank": 1, "name": "Amit Shah", "votes": 95, "percentage": "63.33" },
    { "rank": 2, "name": "Priya Patel", "votes": 55, "percentage": "36.67" }
  ]
}
```

---

### 🛡️ Admin — `/api/admin` *(Admin only)*

| Method | Endpoint          | Description                               |
|--------|-------------------|-------------------------------------------|
| GET    | `/dashboard`      | Full system stats + recent activity       |
| GET    | `/votes`          | All vote records (?electionId=)           |
| DELETE | `/votes/:id`      | Remove a vote + adjust counts             |
| POST   | `/create-admin`   | Create a new admin account                |

---

## 🚨 Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Validation errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

| Status | Meaning              |
|--------|----------------------|
| 200    | OK                   |
| 201    | Created              |
| 400    | Bad request          |
| 401    | Unauthorized         |
| 403    | Forbidden (no role)  |
| 404    | Not found            |
| 409    | Conflict (duplicate) |
| 422    | Validation failed    |
| 500    | Server error         |

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- JWT tokens expire in 7 days
- One vote per user per election enforced at DB level (unique compound index)
- Deactivated accounts cannot log in
- Admins cannot delete their own account
- Active elections cannot be deleted
- Password field excluded from all responses by default (`select: false`)
- Anonymous vote audit trail via SHA-256 hash

---

## 📬 Connecting Frontend

Update your frontend `login.js`, `user.js`, `admin.js` to call these APIs:

```javascript
// Base URL
const API = "http://localhost:5000/api";

// Login example
const res = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const data = await res.json();
localStorage.setItem("token", data.token);

// Authenticated request example
const elections = await fetch(`${API}/elections`, {
  headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
});
```
