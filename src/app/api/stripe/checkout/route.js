// File Path: /src/app/api/stripe/checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";

const PLANS = {
  1: { name: "Starter Bundle", credits: 50, priceCents: 500 },
  2: { name: "Developer Cluster", credits: 250, priceCents: 2000 },
  3: { name: "Enterprise Stream", credits: 1200, priceCents: 7500 }
};

let stripeInstance = null;

function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function POST(request) {
  try {
    const { username, planId } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username details" }, { status: 400 });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid credit plan selected" }, { status: 400 });
    }

    const stripe = getStripe();
    
    // Resolve current base URL dynamically from request headers
    const origin = request.headers.get("origin") || process.env.APP_URL || "http://localhost:3000";

    // Scenario 1: No Stripe keys set -> Enter Simulated Playground Mode
    if (!stripe) {
      console.log(`[Stripe Checkout] STRIPE_SECRET_KEY is not defined. Initiating secure sandbox payments simulation for user "${username}".`);
      
      const mockCheckoutUrl = `${origin}/billing?mock_checkout=true&planId=${planId}&username=${encodeURIComponent(username)}`;
      return NextResponse.json({ 
        simulated: true, 
        url: mockCheckoutUrl 
      });
    }

    // Scenario 2: Active Stripe credentials found -> Create Live checkout session
    console.log(`[Stripe Checkout] STRIPE_SECRET_KEY is active. Initializing production checkout session for user "${username}".`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Cloud Scraper - ${plan.name}`,
              description: `Deposit +${plan.credits} scraping & API credits directly to account "${username}"`,
            },
            unit_amount: plan.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        username: username.toLowerCase(),
        credits: plan.credits.toString(),
        planId: planId.toString(),
        priceCents: plan.priceCents.toString()
      },
    });

    return NextResponse.json({ url: session.url, simulated: false });
  } catch (err) {
    console.error("[Stripe Checkout Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
