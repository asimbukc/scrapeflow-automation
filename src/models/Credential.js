import mongoose from "mongoose";

const CredentialSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
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

export default mongoose.models.Credential || mongoose.model("Credential", CredentialSchema);
