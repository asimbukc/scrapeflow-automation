import React, { useState } from "react";
import { Zap, ShieldCheck, HelpCircle, Trophy, ShoppingBag, CreditCard } from "lucide-react";

export default function BillingView({ credits, onPurchaseMock, onBuyPlan }) {
  const [submitting, setSubmitting] = useState(null);

  const plans = [
    { id: 1, name: "Starter Bundle", credits: 50, price: "$5.00", badge: "POPULAR", desc: "Best for quick manual browser debugging." },
    { id: 2, name: "Developer Cluster", credits: 250, price: "$20.00", badge: "BEST VALUE", desc: "Great for parallel crawling and heavy API parses." },
    { id: 3, name: "Enterprise Stream", credits: 1200, price: "$75.00", badge: "UNLIMITED CRAWL", desc: "For running cron scrapers round the clock." }
  ];

  const handleBuy = async (amount, planId) => {
    setSubmitting(planId);
    try {
      if (onBuyPlan) {
        await onBuyPlan(planId);
      } else if (onPurchaseMock) {
        await onPurchaseMock(amount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="flex-1 bg-black text-zinc-100 p-8 pb-24 overflow-y-auto font-sans relative text-left">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Top Breadcrumb & Status badge */}
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-6 select-none font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-300">BILLING CENTER</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 text-zinc-400 font-mono text-[9px]">
              PREPAID QUOTAS: VERIFIED
            </span>
          </div>
        </div>

        {/* Header Block */}
        <div className="flex items-center justify-between select-none mb-4">
          <div>
            <h1 className="text-3xl font-bold font-sans text-white tracking-tight">Billing & Credits</h1>
            <p className="text-xs text-zinc-400 mt-1">Acquire operational task credits to fuel visual scraper pipelines</p>
          </div>
        </div>

        {/* Big Balance Banner */}
        <div className="bg-[#0b0b0d] border border-zinc-900 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 flex items-center justify-center">
              <Zap className="w-7 h-7 text-emerald-400 fill-emerald-500/10 shrink-0" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold tracking-widest font-mono uppercase">CURRENT OPERATIONAL QUOTA</p>
              <h2 className="text-3xl font-extrabold text-white mt-1 font-sans tracking-tight">
                {credits} <span className="text-zinc-500 font-medium text-lg ml-0.5">credits</span>
              </h2>
            </div>
          </div>
          <div className="text-xs text-zinc-400 max-w-sm leading-relaxed sm:text-right">
            Every component block in your workflow consumes a designated credit amount:
            <ul className="text-[10px] text-zinc-500 mt-1.5 space-y-0.5 list-disc list-inside">
              <li>Launch Headless Canvas: <span className="text-zinc-400">5 credits</span></li>
              <li>Deep Gemini Web Agent parse: <span className="text-zinc-400">4 credits</span></li>
              <li>Navigation actions / HTML extraction: <span className="text-zinc-400">2 credits</span></li>
            </ul>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-zinc-400">Purchase Additional Sandbox Credits</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div 
                key={p.id}
                className="bg-[#0a0a0c] border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-800 transition-all duration-200 group relative"
              >
                {/* Popular Pill badge */}
                <span className="absolute top-4 right-4 bg-zinc-950 border border-zinc-800 text-[8px] font-mono font-bold tracking-widest text-emerald-400 px-2.5 py-1 rounded-full uppercase">
                  {p.badge}
                </span>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-200 font-sans">{p.name}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed font-light">{p.desc}</p>
                  
                  <div className="pt-3 pb-4">
                    <span className="text-2xl font-black text-white font-mono tracking-tight">{p.price}</span>
                    <span className="text-[10px] text-zinc-500 font-sans font-bold ml-1">/ one-time deposit</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(p.credits, p.id)}
                  disabled={submitting !== null}
                  className="w-full py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submitting === p.id ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add +{p.credits} Credits
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security / Handshake banner */}
        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex gap-3.5 items-start font-sans">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-zinc-100 uppercase tracking-wide">Developer Sandbox environment</h4>
            <p className="text-zinc-500 font-light leading-relaxed">
              Payments are simulated in test sandbox mode. No real credit card card details or actual payment receipts will be requested or processed.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
