const mongoose = require("mongoose");
const lectureSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: "" },
  videoId:     { type: String, required: true },   // YouTube ID stored here
  domain:      { type: String, required: true },
  assignedBatches: [{ type: String }],             // Batches this lecture is assigned to (tracking)
  week:        { type: Number, required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  isHidden:    { type: Boolean, default: false },
  duration:    { type: String, default: "" },
}, { timestamps: true });
module.exports = mongoose.model("Lecture", lectureSchema);
