const Candidate = require("../models/Candidate");
const Election = require("../models/Election");

// ─── POST /api/candidates ──────────────────────────────────────────────────── (Admin)
exports.addCandidate = async (req, res) => {
  try {
    const { name, party, bio, image, electionId, symbol, position } = req.body;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    if (election.status === "ended") {
      return res.status(400).json({ success: false, message: "Cannot add candidates to an ended election." });
    }

    const candidate = await Candidate.create({
      name, party, bio, image, symbol, position,
      election: electionId,
    });

    // Add candidate reference to election
    await Election.findByIdAndUpdate(electionId, { $push: { candidates: candidate._id } });

    res.status(201).json({ success: true, message: "Candidate added.", candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/candidates ───────────────────────────────────────────────────── (Public)
exports.getAllCandidates = async (req, res) => {
  try {
    const { electionId } = req.query;
    const query = {};
    if (electionId) query.election = electionId;

    const candidates = await Candidate.find(query)
      .populate("election", "title status")
      .sort({ name: 1 });

    res.json({ success: true, count: candidates.length, candidates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/candidates/:id ───────────────────────────────────────────────── (Public)
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate("election", "title status startDate endDate");

    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found." });
    res.json({ success: true, candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/candidates/:id ───────────────────────────────────────────────── (Admin)
exports.updateCandidate = async (req, res) => {
  try {
    const allowed = ["name", "party", "bio", "image", "symbol", "position", "isActive"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found." });
    res.json({ success: true, message: "Candidate updated.", candidate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/candidates/:id ────────────────────────────────────────────── (Admin)
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate("election");
    if (!candidate) return res.status(404).json({ success: false, message: "Candidate not found." });

    if (candidate.election && candidate.election.status === "active") {
      return res.status(400).json({ success: false, message: "Cannot delete a candidate from an active election." });
    }

    // Remove from election's candidate list
    await Election.findByIdAndUpdate(candidate.election, {
      $pull: { candidates: candidate._id },
    });

    await candidate.deleteOne();
    res.json({ success: true, message: "Candidate deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
