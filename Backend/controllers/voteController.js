const Vote = require("../models/Vote");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const User = require("../models/User");
const crypto = require("crypto");

// ─── POST /api/vote ────────────────────────────────────────────────────────── (Voter)
exports.castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const voterId = req.user.id;

    // Validate election exists and is active
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.status !== "active") {
      return res.status(400).json({ success: false, message: "This election is not currently active." });
    }

    // Validate candidate belongs to this election
    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId, isActive: true });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found in this election." });
    }

    // Check if user already voted in this election
    const existingVote = await Vote.findOne({ voter: voterId, election: electionId });
    if (existingVote) {
      return res.status(409).json({ success: false, message: "You have already voted in this election." });
    }

    // Generate anonymous vote hash for audit trail
    const voteHash = crypto
      .createHash("sha256")
      .update(`${voterId}${electionId}${Date.now()}`)
      .digest("hex");

    // Record the vote
    const vote = await Vote.create({
      voter: voterId,
      candidate: candidateId,
      election: electionId,
      voteHash,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Increment candidate's vote count
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    // Increment election's total votes
    await Election.findByIdAndUpdate(electionId, { $inc: { totalVotes: 1 } });

    // Mark user as having voted in this election
    await User.findByIdAndUpdate(voterId, {
      hasVoted: true,
      $addToSet: { votedIn: electionId },
    });

    res.status(201).json({
      success: true,
      message: "Your vote has been recorded successfully.",
      voteHash, // Return hash for voter's reference
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already voted in this election." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/vote/status/:electionId ─────────────────────────────────────── (Voter)
exports.getVoteStatus = async (req, res) => {
  try {
    const { electionId } = req.params;
    const vote = await Vote.findOne({ voter: req.user.id, election: electionId });

    res.json({
      success: true,
      hasVoted: !!vote,
      voteHash: vote ? vote.voteHash : null,
      votedAt: vote ? vote.createdAt : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/vote/my-votes ────────────────────────────────────────────────── (Voter)
exports.getMyVotes = async (req, res) => {
  try {
    const votes = await Vote.find({ voter: req.user.id })
      .populate("election", "title status startDate endDate")
      .populate("candidate", "name party")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: votes.length, votes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/vote/verify/:hash ────────────────────────────────────────────── (Public)
exports.verifyVote = async (req, res) => {
  try {
    const vote = await Vote.findOne({ voteHash: req.params.hash })
      .populate("election", "title status")
      .select("-voter"); // Don't expose voter identity

    if (!vote) {
      return res.status(404).json({ success: false, message: "Vote not found. Invalid hash." });
    }

    res.json({
      success: true,
      message: "Vote is valid and recorded.",
      vote: {
        election: vote.election,
        castAt: vote.createdAt,
        voteHash: vote.voteHash,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
