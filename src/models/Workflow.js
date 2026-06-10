import mongoose from "mongoose";

const WorkflowSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    trigger: {
      type: String,
      default: "Manual",
    },
    credits: {
      type: Number,
      default: 5,
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    lastRunStatus: {
      type: String,
      default: "",
    },
    lastRunTime: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Workflow || mongoose.model("Workflow", WorkflowSchema);
