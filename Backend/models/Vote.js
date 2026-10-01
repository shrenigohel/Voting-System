const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
    },
    // Store a hash for audit (voter identity is protected)
    voteHash: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Ensure one vote per voter per election
VoteSchema.index({ voter: 1, election: 1 }, { unique: true });

module.exports = mongoose.model("Vote", VoteSchema);
