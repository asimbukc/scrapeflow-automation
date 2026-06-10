// File Path: /src/app/billing/page.jsx
'use client';

import React, { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import BillingView from "@/components/BillingView";
import { useCreditsQuery, usePurchaseCreditsMutation } from "@/hooks/useQueries";
import { 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Calendar, 
  Hash, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Check,
  RefreshCw
} from "lucide-react";

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.user);
  const username = user?.username || "";

  // React Query queries
  const { data: credits = 0 } = useCreditsQuery(username);
  const purchaseCreditsMut = usePurchaseCreditsMutation();

  // URL state checking inside useEffect to prevent Next SSR/Static bailouts
  const [urlParams, setUrlParams] = useState({
    mockCheckout: false,
    planId: null,
    sessionId: null,
    canceled: false,
  });

  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); // 'success', 'error', 'already_claimed'
  const [verifiedCredits, setVerifiedCredits] = useState(0);

  // Simulation form states
  const [simForm, setSimForm] = useState({
    email: user?.email || `${username}@example.com`,
    cardName: user?.name || username.toUpperCase(),
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    zipCode: "90210"
  });
  const [simState, setSimState] = useState("idle"); // 'idle', 'processing', 'success', 'failed'
  const [simProgressMessage, setSimProgressMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const plans = {
    1: { name: "Starter Bundle", credits: 50, price: "$5.00", amount: 50 },
    2: { name: "Developer Cluster", credits: 250, price: "$20.00", amount: 250 },
    3: { name: "Enterprise Stream", credits: 1200, price: "$75.00", amount: 1200 }
  };

  const selectedPlan = urlParams.planId ? plans[urlParams.planId] : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        mockCheckout: searchParams.get("mock_checkout") === "true",
        planId: searchParams.get("planId"),
        sessionId: searchParams.get("session_id"),
        canceled: searchParams.get("canceled") === "true",
      });
    }
  }, []);

  // Effect to verify a real Stripe Session
  useEffect(() => {
    if (urlParams.sessionId && username) {
      const verifyRealStripeSession = async () => {
        setVerifying(true);
        try {
          const res = await fetch(`/api/stripe/verify?session_id=${urlParams.sessionId}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setVerifyStatus("success");
            setVerifiedCredits(data.creditsAdded || 0);
            queryClient.invalidateQueries({ queryKey: ["credits", username] });
          } else {
            setVerifyStatus(data.alreadyClaimed ? "already_claimed" : "error");
            if (data.creditsAdded) setVerifiedCredits(data.creditsAdded);
          }
        } catch (err) {
          console.error(err);
          setVerifyStatus("error");
        } finally {
          setVerifying(false);
        }
      };
      verifyRealStripeSession();
    }
  }, [urlParams.sessionId, username, queryClient]);

  // Initiate Stripe Checkout session
  const handleBuyPlan = async (planId) => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate Stripe connection.");
      }
      
      // Redirect to target checkout flow
      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "Error processing checkout dispatch.");
    }
  };

  // Prefill the Sandbox payment details with standard Stripe test cards
  const autofillSandboxDetails = () => {
    setSimForm({
      email: user?.email || `${username}@example.com`,
      cardName: user?.name || username.toUpperCase() || "JANE DOE",
      cardNumber: "4242 4242 4242 4242",
      cardExpiry: "12/29",
      cardCvc: "424",
      zipCode: "90210"
    });
    setValidationError("");
  };

  // Handle simulated checkout submission
  const handleSimulatedPaymentSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    // Simple realistic validation checks
    if (!simForm.cardNumber || simForm.cardNumber.replace(/\s/g, "").length !== 16) {
      setValidationError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!simForm.cardExpiry || !simForm.cardExpiry.includes("/")) {
      setValidationError("Please enter card expiry in MM/YY format.");
      return;
    }
    if (!simForm.cardCvc || simForm.cardCvc.length < 3) {
      setValidationError("Please enter a valid CVC security code.");
      return;
    }
    if (!simForm.cardName) {
      setValidationError("Please enter the name printed on the card.");
      return;
    }

    setSimState("processing");

    // Cycle through realistic loading messages to emulate live webhooks
    const stages = [
      { text: "Contacting Visa/Mastercard processing token gateway...", delay: 0 },
      { text: "Validating secure 3D-Secure sandbox challenge cryptogram...", delay: 800 },
      { text: "Capturing payment authorization hold ($" + (selectedPlan?.price || "$5.00") + ")...", delay: 1700 },
      { text: "Credit allocation handshake: Updating MongoDB operational quota ledger...", delay: 2600 }
    ];

    stages.forEach((stage) => {
      setTimeout(() => {
        setSimProgressMessage(stage.text);
      }, stage.delay);
    });

    // Execute the actual credit update API call on the server side
    setTimeout(async () => {
      try {
        await purchaseCreditsMut.mutateAsync({
          username,
          amount: selectedPlan.amount
        });
        setSimState("success");
      } catch (err) {
        console.error(err);
        setSimState("failed");
      }
    }, 3800);
  };

  // Clear query parameters and return to standard view
  const clearUrlAndReset = () => {
    setSimState("idle");
    setVerifyStatus(null);
    if (typeof window !== "undefined") {
      window.history.pushState({}, document.title, window.location.pathname);
      setUrlParams({
        mockCheckout: false,
        planId: null,
        sessionId: null,
        canceled: false,
      });
    }
  };

  return (
    <DashboardLayout activeTab="billing">
      <div className="relative min-h-screen">
        <BillingView
          credits={credits}
          onBuyPlan={handleBuyPlan}
        />

        {/* 1. Stripe Checkout Verification State Overlay */}
        {(verifying || verifyStatus) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0c0c0e] border border-zinc-900 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
              
              {verifying ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-sans">Verifying Stripe checkout</h3>
                  <p className="text-xs text-zinc-500 font-light leading-relaxed">
                    Establishing handshakes with Stripe micro-services to audit secure payment checkout credentials...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {verifyStatus === "success" && (
                    <>
                      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <Check className="w-8 h-8 text-emerald-400 stroke-[3]" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-white tracking-tight">Payment Verified!</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">
                          Stripe verified a credit card charge. We have successfully unlocked and added <span className="text-emerald-400 font-semibold">{verifiedCredits} Credits </span> to your billing account.
                        </p>
                      </div>
                    </>
                  )}

                  {verifyStatus === "already_claimed" && (
                    <>
                      <div className="w-16 h-16 bg-zinc-500/10 border border-zinc-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-zinc-400" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-extrabold text-white">Payment Already Claimed</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed font-light">
                          This checkout session token was already audited and credited to balance quota previously.
                        </p>
                      </div>
                    </>
                  )}

                  {verifyStatus === "error" && (
                    <>
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold text-red-400">Payment Unsuccessful</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed font-light">
                          Our billing processor could not verify this session identifier, or the transaction was canceled.
                        </p>
                      </div>
                    </>
                  )}

                  <button
                    onClick={clearUrlAndReset}
                    className="w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-95 transition-all"
                  >
                    Return to Billing Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Stripe Checkout Simulating Playground Screen Overlay */}
        {urlParams.mockCheckout && selectedPlan && (
          <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex items-center justify-center">
            
            <div className="w-full min-h-screen lg:min-h-0 lg:max-w-4xl lg:rounded-2xl border lg:border-zinc-900 bg-black shadow-2xl flex flex-col lg:flex-row overflow-hidden font-sans text-left relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              {/* Left Pane: Purchase Sum & Branding Details */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-900 bg-zinc-950 flex flex-col justify-between">
                <div>
                  <button 
                    onClick={clearUrlAndReset}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors uppercase font-mono font-bold tracking-widest mb-10 select-none cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancel Deposit
                  </button>

                  <div className="space-y-1.5 select-none text-left">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-widest uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                      STRIPE PLAYGROUND
                    </span>
                    <h2 className="text-sm font-semibold text-zinc-400 mt-2">Cloud Scraper Services</h2>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none mt-1">
                      {selectedPlan.price}
                    </h1>
                  </div>

                  {/* Cart Details */}
                  <div className="mt-8 pt-6 border-t border-zinc-900 space-y-4">
                    <div className="flex justify-between text-xs text-zinc-300">
                      <div>
                        <p className="font-bold">{selectedPlan.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Secure operational credit packet</p>
                      </div>
                      <p className="font-mono font-bold text-white">{selectedPlan.price}</p>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-900/60 font-mono">
                      <span>Credits Awarded</span>
                      <span className="text-emerald-400">+{selectedPlan.amount} Credits</span>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-[11px] text-zinc-500 flex flex-col gap-2.5 select-none">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Protected by 256-bit Sandbox Certificate</span>
                  </div>
                  <p className="font-light leading-relaxed">
                    This sandbox overlay accurately duplicates Stripe Checkout flow. Real MongoDB updates are recorded to allow instant local feature evaluation.
                  </p>
                </div>
              </div>

              {/* Right Pane: Custom Credit Card Element form */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                {simState === "idle" && (
                  <form onSubmit={handleSimulatedPaymentSubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono">Mock Card Payment</h3>
                      <button
                        type="button"
                        onClick={autofillSandboxDetails}
                        className="text-[10px] font-mono font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-md transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 fill-emerald-400/20" /> Autofill Sandbox
                      </button>
                    </div>

                    {validationError && (
                      <div className="p-3 bg-red-950/25 border border-red-950 text-red-400 rounded-lg text-xs flex items-center gap-2 select-none">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Email address */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">Email Address</label>
                        <input
                          type="email"
                          required
                          value={simForm.email}
                          onChange={(e) => setSimForm({ ...simForm, email: e.target.value })}
                          placeholder="your-email@site.com"
                          className="w-full bg-[#0d0d0f] border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 font-sans focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                      </div>

                      {/* Card fields */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">Card Information</label>
                        <div className="bg-[#0d0d0f] border border-zinc-900 rounded-lg overflow-hidden focus-within:border-zinc-700 transition-colors">
                          <div className="flex items-center px-3 border-b border-zinc-900/60 py-2.5">
                            <CreditCard className="w-4 h-4 text-zinc-600 mr-2" />
                            <input
                              type="text"
                              required
                              value={simForm.cardNumber}
                              onChange={(e) => {
                                // Add space format like real inputs
                                let v = e.target.value.replace(/\s?/g, "");
                                if (v.length > 16) v = v.substring(0, 16);
                                const parts = v.match(/.{1,4}/g);
                                setSimForm({ ...simForm, cardNumber: parts ? parts.join(" ") : "" });
                              }}
                              placeholder="4242 4242 4242 4242"
                              className="bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-750 font-mono w-full focus:ring-0 focus:outline-none"
                            />
                          </div>
                          <div className="flex divide-x divide-zinc-900/60">
                            <div className="w-1/2 flex items-center px-3 py-2">
                              <Calendar className="w-3.5 h-3.5 text-zinc-650 mr-2" />
                              <input
                                type="text"
                                required
                                value={simForm.cardExpiry}
                                onChange={(e) => {
                                  let v = e.target.value.replace(/\//g, "");
                                  if (v.length > 4) v = v.substring(0, 4);
                                  if (v.length >= 2) {
                                    v = v.substring(0, 2) + "/" + v.substring(2);
                                  }
                                  setSimForm({ ...simForm, cardExpiry: v });
                                }}
                                placeholder="MM/YY"
                                className="bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-750 font-mono w-full focus:ring-0 focus:outline-none"
                              />
                            </div>
                            <div className="w-1/2 flex items-center px-3 py-2">
                              <Hash className="w-3.5 h-3.5 text-zinc-650 mr-2" />
                              <input
                                type="password"
                                required
                                value={simForm.cardCvc}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, "").substring(0, 4);
                                  setSimForm({ ...simForm, cardCvc: v });
                                }}
                                placeholder="CVC"
                                className="bg-transparent border-0 p-0 text-xs text-white placeholder-zinc-750 font-mono w-full focus:ring-0 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={simForm.cardName}
                          onChange={(e) => setSimForm({ ...simForm, cardName: e.target.value })}
                          placeholder="e.g. JANE DOE"
                          className="w-full bg-[#0d0d0f] border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 font-sans focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                      </div>

                      {/* Zip / Country */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase font-mono">Billing Postcode / ZIP</label>
                        <input
                          type="text"
                          required
                          value={simForm.zipCode}
                          onChange={(e) => setSimForm({ ...simForm, zipCode: e.target.value })}
                          placeholder="90210"
                          className="w-full bg-[#0d0d0f] border border-zinc-900 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-700 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer select-none"
                    >
                      Process Payment for {selectedPlan.price}
                    </button>
                  </form>
                )}

                {/* Processing Sandbox State */}
                {simState === "processing" && (
                  <div className="text-center space-y-6 select-none max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-zinc-950 border border-zinc-900 rounded-full flex items-center justify-center mx-auto shadow-inner relative">
                      <div className="absolute inset-0 rounded-full border-2 border-zinc-800 border-t-white animate-spin" />
                      <CreditCard className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white tracking-tight">Processing Sandbox Authorization...</h3>
                      <p className="text-[11px] text-zinc-500 font-mono leading-relaxed h-10 flex items-center justify-center">
                        {simProgressMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sandbox Payment Successful */}
                {simState === "success" && (
                  <div className="text-center space-y-6 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                      <Check className="w-8 h-8 text-emerald-400 stroke-[3]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">Primacy Verification Confirmed</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed font-light">
                        Excellent! Your sandbox verification succeeded. We mapped and registered <span className="text-emerald-400 font-mono font-semibold">+{selectedPlan.amount} credits </span> on your account record seamlessly.
                      </p>
                    </div>
                    <button
                      onClick={clearUrlAndReset}
                      className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                )}

                {/* Sandbox Payment Failed */}
                {simState === "failed" && (
                  <div className="text-center space-y-6 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/25 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="space-y-2 col-span-3">
                      <h3 className="text-lg font-bold text-white">Sandbox Processing Failed</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Internal connection timed out or write locks occurred on current sandboxed context. Please verify card credentials and retry.
                      </p>
                    </div>
                    <button
                      onClick={() => setSimState("idle")}
                      className="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                    >
                      Retry Payment Form
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
