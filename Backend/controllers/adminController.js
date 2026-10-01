const User = require("../models/User");
const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

// ─── GET /api/admin/dashboard ──────────────────────────────────────────────── (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVoters,
      totalAdmins,
      activeUsers,
      totalElections,
      activeElections,
      upcomingElections,
      endedElections,
      totalCandidates,
      totalVotes,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "voter" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isActive: true }),
      Election.countDocuments(),
      Election.countDocuments({ status: "active" }),
      Election.countDocuments({ status: "upcoming" }),
      Election.countDocuments({ status: "ended" }),
      Candidate.countDocuments(),
      Vote.countDocuments(),
    ]);

    const votersWhoVoted = await User.countDocuments({ hasVoted: true });
    const voterTurnout = totalVoters > 0
      ? ((votersWhoVoted / totalVoters) * 100).toFixed(2)
      : "0.00";

    // Recent activity: last 5 votes cast
    const recentVotes = await Vote.find()
      .populate("voter", "name email")
      .populate("candidate", "name party")
      .populate("election", "title")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent users
    const recentUsers = await User.find()
      .select("name email role createdAt isActive")
      .sort({ createdAt: -1 })
      .limit(5);

    // Votes cast per election
    const votesByElection = await Vote.aggregate([
      { $group: { _id: "$election", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "elections",
          localField: "_id",
          foreignField: "_id",
          as: "election",
        },
      },
      { $unwind: "$election" },
      {
        $project: {
          _id: 0,
          electionId: "$_id",
          title: "$election.title",
          status: "$election.status",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, voters: totalVoters, admins: totalAdmins, active: activeUsers },
        elections: { total: totalElections, active: activeElections, upcoming: upcomingElections, ended: endedElections },
        candidates: { total: totalCandidates },
        votes: { total: totalVotes, votersWhoVoted, voterTurnout: `${voterTurnout}%` },
      },
      votesByElection,
      recentVotes,
      recentUsers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/votes ──────────────────────────────────────────────────── (Admin)
exports.getAllVotes = async (req, res) => {
  try {
    const { electionId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (electionId) query.election = electionId;

    const total = await Vote.countDocuments(query);
    const votes = await Vote.find(query)
      .populate("voter", "name email voterId")
      .populate("candidate", "name party")
      .populate("election", "title status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      votes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/create-admin ─────────────────────────────────────────── (Admin)
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const admin = await User.create({ name, email, password, role: "admin", isVerified: true });
    admin.password = undefined;

    res.status(201).json({ success: true, message: "Admin account created.", user: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/votes/:id ───────────────────────────────────────────── (Admin)
exports.deleteVote = async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) return res.status(404).json({ success: false, message: "Vote not found." });

    // Decrement candidate votes and election total
    await Candidate.findByIdAndUpdate(vote.candidate, { $inc: { votes: -1 } });
    await Election.findByIdAndUpdate(vote.election, { $inc: { totalVotes: -1 } });
    await vote.deleteOne();

    res.json({ success: true, message: "Vote removed and counts adjusted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
