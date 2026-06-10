import mongoose from "mongoose";

const RunFlowSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    phases: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

// Delete compilation cache to avoid Hot Module Replacement reload schema mismatches
if (mongoose.models.RunFlow) {
  delete mongoose.models.RunFlow;
}

export default mongoose.model("RunFlow", RunFlowSchema);
