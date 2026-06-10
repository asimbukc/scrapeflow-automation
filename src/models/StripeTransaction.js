import mongoose from "mongoose";

const StripeTransactionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    creditsAdded: {
      type: Number,
      required: true,
    },
    amountTotal: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    paymentStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

if (mongoose.models.StripeTransaction) {
  delete mongoose.models.StripeTransaction;
}

export default mongoose.model("StripeTransaction", StripeTransactionSchema);
