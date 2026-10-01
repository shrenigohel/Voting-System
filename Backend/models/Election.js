const mongoose = require("mongoose");

const ElectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Election title is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["upcoming", "active", "ended"],
      default: "upcoming",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "Candidate" }],
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublished: { type: Boolean, default: false },
    allowedVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // empty = all voters allowed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Election", ElectionSchema);
