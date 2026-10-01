const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

// ─── POST /api/elections ───────────────────────────────────────────────────── (Admin)
exports.createElection = async (req, res) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: "End date must be after start date." });
    }

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, message: "Election created.", election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/elections ────────────────────────────────────────────────────── (Public)
exports.getAllElections = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;

    // Non-admins see only published elections
    if (!req.user || req.user.role !== "admin") {
      query.isPublished = true;
    }

    const total = await Election.countDocuments(query);
    const elections = await Election.find(query)
      .populate("candidates", "name party votes image")
      .populate("createdBy", "name email")
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), totalPages: Math.ceil(total / limit), elections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/elections/:id ────────────────────────────────────────────────── (Public)
exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate("candidates", "name party votes image bio symbol position")
      .populate("createdBy", "name email");

    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    res.json({ success: true, election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/elections/:id ────────────────────────────────────────────────── (Admin)
exports.updateElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    if (election.status === "ended") {
      return res.status(400).json({ success: false, message: "Cannot edit an ended election." });
    }

    const allowed = ["title", "description", "startDate", "endDate", "isPublished"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) election[f] = req.body[f]; });
    await election.save();

    res.json({ success: true, message: "Election updated.", election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/elections/:id ─────────────────────────────────────────────── (Admin)
exports.deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    if (election.status === "active") {
      return res.status(400).json({ success: false, message: "Cannot delete an active election." });
    }

    // Delete related candidates and votes
    await Candidate.deleteMany({ election: election._id });
    await Vote.deleteMany({ election: election._id });
    await election.deleteOne();

    res.json({ success: true, message: "Election and all related data deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/elections/:id/start ─────────────────────────────────────────── (Admin)
exports.startElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    if (election.status !== "upcoming") {
      return res.status(400).json({ success: false, message: "Only upcoming elections can be started." });
    }

    const candidateCount = await Candidate.countDocuments({ election: election._id, isActive: true });
    if (candidateCount < 2) {
      return res.status(400).json({ success: false, message: "At least 2 active candidates are required to start an election." });
    }

    election.status = "active";
    election.isPublished = true;
    election.startDate = new Date();
    await election.save();

    res.json({ success: true, message: "Election started.", election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/elections/:id/end ────────────────────────────────────────────── (Admin)
exports.endElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    if (election.status !== "active") {
      return res.status(400).json({ success: false, message: "Only active elections can be ended." });
    }

    election.status = "ended";
    election.endDate = new Date();
    await election.save();

    res.json({ success: true, message: "Election ended.", election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/elections/:id/publish ───────────────────────────────────────── (Admin)
exports.publishElection = async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    res.json({ success: true, message: "Election published.", election });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
