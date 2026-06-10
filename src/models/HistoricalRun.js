import mongoose from "mongoose";

const HistoricalRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    startedAt: {
      type: String,
      required: true,
    },
    workflowId: {
      type: String,
    },
    workflowName: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      default: "completed",
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    creditsConsumed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// If the model was previously compiled without the new fields during hot-reload,
// delete it from Mongoose's cache so it recompiles with the absolute latest schema.
if (mongoose.models.HistoricalRun) {
  delete mongoose.models.HistoricalRun;
}

export default mongoose.model("HistoricalRun", HistoricalRunSchema);
