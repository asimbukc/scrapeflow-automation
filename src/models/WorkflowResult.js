import mongoose from "mongoose";

const WorkflowResultSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    workflowId: {
      type: String,
      required: true,
      index: true,
    },
    workflowName: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

if (mongoose.models.WorkflowResult) {
  delete mongoose.models.WorkflowResult;
}

export default mongoose.model("WorkflowResult", WorkflowResultSchema);
