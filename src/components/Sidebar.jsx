import { Home, Layers, ShieldCheck, CreditCard, Zap } from "lucide-react";
export default function Sidebar({ activeTab, onTabChange, credits }) {
  const menuItems = [
    { id: "home", label: "HOME", icon: Home },
    { id: "workflows", label: "WORKFLOWS", icon: Layers },
    { id: "credentials", label: "CREDENTIALS", icon: ShieldCheck },
    { id: "billing", label: "BILLING", icon: CreditCard }
  ];
  return <div className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-full shrink-0">
      {
    /* Brand Header representing Next-gen Edge tool */
  }
      <div className="p-6 flex items-center justify-start border-b border-zinc-800/60">
        <div>
          <span className="font-bold text-lg tracking-tight text-white">
            FLOW<span className="text-zinc-500 font-semibold text-base ml-0.5">SCRAPE</span>
          </span>
        </div>
      </div>

      {
    /* Credit Status Badge right under header */
  }
      <div className="px-5 py-4">
        <div className="bg-zinc-900/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-bold tracking-wider font-mono">CREDITS</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
            {credits}
          </span>
        </div>
      </div>

      {
    /* Navigation Links */
  }
      <nav className="flex-1 px-3 py-2 space-y-1.5">
        {menuItems.map((item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return <button
      key={item.id}
      onClick={() => onTabChange(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wider transition-all duration-200 text-left cursor-pointer ${isActive ? "bg-white text-black shadow-lg shadow-white/5" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"}`}
    >
              <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-zinc-500"}`} />
              <span>{item.label}</span>
              {item.id === "workflows" && null}
            </button>;
  })}
      </nav>

      {
    /* Footer Info */
  }
      <div className="p-4 border-t border-zinc-800/60 text-center">
        <span className="text-[10px] text-zinc-650 text-zinc-500 font-mono tracking-widest font-bold">ENGINE @ v16.0.0</span>
      </div>
    </div>;
}
