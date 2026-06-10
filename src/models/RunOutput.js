import mongoose from "mongoose";

const RunOutputSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    outputs: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Delete compilation cache to avoid Hot Module Replacement reload schema mismatches
if (mongoose.models.RunOutput) {
  delete mongoose.models.RunOutput;
}

export default mongoose.model("RunOutput", RunOutputSchema);
