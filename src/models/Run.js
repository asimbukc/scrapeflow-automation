import mongoose from "mongoose";

const RunSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workflowId: {
      type: String,
      required: true,
    },
    workflowName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    startedAt: {
      type: String,
      required: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    creditsConsumed: {
      type: Number,
      default: 0,
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.Run) {
  delete mongoose.models.Run;
}

export default mongoose.model("Run", RunSchema);

