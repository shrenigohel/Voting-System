const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    party: {
      type: String,
      required: [true, "Party name is required"],
      trim: true,
    },
    bio: { type: String, trim: true },
    image: { type: String },
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: [true, "Election reference is required"],
    },
    votes: { type: Number, default: 0 },
    symbol: { type: String },
    position: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", CandidateSchema);
