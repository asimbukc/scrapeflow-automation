// File Path: /src/app/api/stripe/verify/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { StripeTransactionRepository, UserRepository } from "@/lib/db/repository";

let stripeInstance = null;

function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id verification token" }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe integration is in sandbox/simulation layout." }, { status: 400 });
    }

    // Is this transaction already claimed?
    const existingTx = await StripeTransactionRepository.findBySessionId(sessionId);
    if (existingTx) {
      return NextResponse.json({ 
        success: true, 
        alreadyClaimed: true, 
        message: "This secure payment was already credited to your balance.",
        creditsAdded: existingTx.creditsAdded
      });
    }

    // Fetch the active checkout session status from Stripe backends
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment verification failed: session is unpaid." }, { status: 400 });
    }

    const username = session.metadata?.username;
    const credits = parseInt(session.metadata?.credits, 10) || 0;

    if (!username || credits <= 0) {
      return NextResponse.json({ error: "Checkout session is missing custom metadata tags." }, { status: 400 });
    }

    // Save transaction to prevent double claiming
    await StripeTransactionRepository.createTransaction({
      sessionId,
      username,
      creditsAdded: credits,
      amountTotal: session.amount_total,
      currency: session.currency || "usd",
      paymentStatus: session.payment_status,
    });

    // Award account credits
    const updatedUser = await UserRepository.updateCredits(username, credits, "purchase");

    console.log(`[Stripe Claim Success] Successfully processed +${credits} credits for account "${username}" (session: ${sessionId})`);

    return NextResponse.json({
      success: true,
      creditsAdded: credits,
      newBalance: updatedUser.credits,
      message: "Payment verified! Credits successfully uploaded."
    });
  } catch (err) {
    console.error("[Stripe Verification Error]", err);
    return NextResponse.json({ error: err?.message || "Internal payment review error" }, { status: 500 });
  }
}
