const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

// ─── GET /api/results/:electionId ─────────────────────────────────────────── (Public)
exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    // Only admins can see results of active elections
    if (election.status === "active" && (!req.user || req.user.role !== "admin")) {
      return res.status(403).json({ success: false, message: "Results are available only after the election ends." });
    }

    const candidates = await Candidate.find({ election: election._id, isActive: true })
      .sort({ votes: -1 })
      .select("name party votes image symbol");

    const totalVotes = election.totalVotes || candidates.reduce((sum, c) => sum + c.votes, 0);

    const results = candidates.map((c, index) => ({
      rank: index + 1,
      _id: c._id,
      name: c.name,
      party: c.party,
      image: c.image,
      symbol: c.symbol,
      votes: c.votes,
      percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) : "0.00",
    }));

    const winner = results.length > 0 && election.status === "ended" ? results[0] : null;

    res.json({
      success: true,
      election: {
        _id: election._id,
        title: election.title,
        status: election.status,
        startDate: election.startDate,
        endDate: election.endDate,
        totalVotes,
      },
      winner,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/results ──────────────────────────────────────────────────────── (Public)
exports.getAllResults = async (req, res) => {
  try {
    const elections = await Election.find({ status: "ended", isPublished: true })
      .select("title totalVotes startDate endDate")
      .sort({ endDate: -1 });

    const summaries = await Promise.all(
      elections.map(async (election) => {
        const winner = await Candidate.findOne({ election: election._id })
          .sort({ votes: -1 })
          .select("name party votes");
        return { election, winner };
      })
    );

    res.json({ success: true, count: summaries.length, results: summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/results/:electionId/live ────────────────────────────────────── (Admin)
exports.getLiveResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    const candidates = await Candidate.find({ election: election._id })
      .sort({ votes: -1 })
      .select("name party votes image");

    const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

    // Votes over time (hourly buckets)
    const voteTimeline = await Vote.aggregate([
      { $match: { election: election._id } },
      {
        $group: {
          _id: {
            hour: { $dateToString: { format: "%Y-%m-%dT%H:00", date: "$createdAt" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.hour": 1 } },
    ]);

    res.json({
      success: true,
      election: { _id: election._id, title: election.title, status: election.status, totalVotes },
      candidates: candidates.map((c) => ({
        ...c.toObject(),
        percentage: totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(2) : "0.00",
      })),
      voteTimeline,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
