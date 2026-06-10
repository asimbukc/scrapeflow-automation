import { useState } from "react";
import { 
  User, 
  Lock, 
  MapPin, 
  Cpu, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Compass, 
  Target, 
  Users, 
  Briefcase, 
  Mail, 
  Fingerprint
} from "lucide-react";
import { userService } from "@/services/user.service";

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Onboarding phase variables
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardUser, setOnboardUser] = useState(null);

  // Final step fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState("");
  const [teamDetails, setTeamDetails] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const data = await userService.login(username, password);

      // Check if onboarding was completed
      if (!data.onboardingCompleted) {
        setOnboardUser(data);
        setIsOnboarding(true);
        setOnboardingStep(1);
      } else {
        localStorage.setItem("flowscrape_user", JSON.stringify(data));
        onAuthSuccess(data);
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong during authentication");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const data = await userService.register(username, password);

      // Direct registration succeeds -> Immediately route to Onboarding screen!
      setOnboardUser(data);
      setIsOnboarding(true);
      setOnboardingStep(1);
    } catch (err) {
      setErrorMsg(err.message || "Failed to finalize registration");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingNext = () => {
    setOnboardingStep((prev) => prev + 1);
  };

  const handleCompleteOnboarding = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !profession.trim() || !teamDetails.trim()) {
      setErrorMsg("Please fill out all the fields in the form of the final setup step.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const data = await userService.onboard(
        onboardUser.username,
        name.trim(),
        email.trim(),
        profession.trim(),
        teamDetails.trim()
      );

      // Store authenticated user with onboard completed & 100 credits awarded!
      localStorage.setItem("flowscrape_user", JSON.stringify(data));
      onAuthSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || "Failed to process onboarding session");
    } finally {
      setLoading(false);
    }
  };

  // Render Onboarding content
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-4 relative font-sans overflow-hidden select-none">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-zinc-900/30 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-zinc-800/10 blur-[130px] pointer-events-none -z-10" />

        <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col relative overflow-hidden text-left transition-all duration-300">
          {/* Progress Indicator */}
          <div className="shrink-0 flex items-center gap-2 mb-4 select-none animate-fade-in">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 h-1 rounded-full bg-zinc-900 overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all duration-300 ${onboardingStep >= step ? "w-full" : "w-0"}`} 
                />
              </div>
            ))}
          </div>

          {onboardingStep === 1 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                    <Compass className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 id="onboard-title-1" className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                      Start scraping with FlowScrape
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-mono">
                      Visual-first extraction at scale
                    </p>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Welcome, <span className="text-white font-semibold">{onboardUser?.username}</span>! FlowScrape is an interactive workspace designed to extract directory tables, posts list, and AI-formatted datasets from any address instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-850 transition-colors flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Cpu className="w-4 h-4 text-zinc-400 shrink-0" />
                      <h4 className="text-xs font-semibold">Interactive Canvas</h4>
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-normal font-sans">
                      Connect flow action blocks easily. Chain viewport viewports, navigation links, and customized scrapers with zero code.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 flex flex-col gap-1 hover:border-zinc-850 transition-colors text-left">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Bot className="w-4 h-4 text-zinc-400 shrink-0" />
                      <h4 className="text-xs font-semibold">Bypass Protocols</h4>
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-normal font-sans">
                      Seamlessly formats HTTP header fields, user-agent profiles, and sandbox nodes to handle cloud tracking defenses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action feet */}
              <div className="shrink-0 pt-4 flex justify-end border-t border-zinc-900 mt-5">
                <button
                  id="onboard-next-1"
                  onClick={handleOnboardingNext}
                  className="px-5 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all duration-150 font-semibold text-xs flex items-center gap-1.5 shadow-lg select-none cursor-pointer shrink-0"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-amber-400 shrink-0 select-none shadow-lg">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 id="onboard-title-2" className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                      Intelligent Scraper Targets
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-mono">
                      CSS targets & Gemini-driven structuring
                    </p>
                  </div>
                </div>

                <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                  Query and target complex DOM structures precisely using flexible standards, or translate raw layout fragments with LLM filters.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 flex flex-col gap-1 hover:border-zinc-850 transition-colors text-left">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Target className="w-4 h-4 text-zinc-400 shrink-0" />
                      <h4 className="text-xs font-semibold">Cheerio Parsing</h4>
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-normal font-sans">
                      Input css targeting tags like <code className="text-amber-500 font-mono text-[9.5px]">div.item-card h2</code> to harvest list targets instantly.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 flex flex-col gap-1 hover:border-zinc-850 transition-colors text-left">
                    <div className="flex items-center gap-2 text-zinc-200">
                      <Bot className="w-4 h-4 text-zinc-400 shrink-0" />
                      <h4 className="text-xs font-semibold">Gemini Extractor</h4>
                    </div>
                    <p className="text-zinc-500 text-[11px] leading-normal font-sans">
                      Feed document trees to Gemini. Extract clean, automated nested JSON matching your preferred object schema structure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action feet */}
              <div className="shrink-0 pt-4 flex justify-end border-t border-zinc-900 mt-5">
                <button
                  id="onboard-next-2"
                  onClick={handleOnboardingNext}
                  className="px-5 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-95 transition-all duration-150 font-semibold text-xs flex items-center gap-1.5 shadow-lg select-none cursor-pointer shrink-0"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <form onSubmit={handleCompleteOnboarding} className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-cyan-400 shrink-0 transform hover:scale-105 transition-all duration-200">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 id="onboard-title-3" className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                      Start scraping with 100 Credits
                    </h2>
                    <p className="text-zinc-500 text-[10px] font-mono">
                      Profile registration // free workspace allocation
                    </p>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-red-950/40 border border-red-900/60 rounded-lg text-red-400 text-[11px] text-left">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 text-left">
                    <label id="label-name" className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="ob-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full h-8 bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-lg pl-8.5 pr-3 text-[11px] text-white focus:outline-none focus:border-zinc-600 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label id="label-email" className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider">Work Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="ob-email"
                        type="email"
                        placeholder="john@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-8 bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-lg pl-8.5 pr-3 text-[11px] text-white focus:outline-none focus:border-zinc-600 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 text-left">
                    <label id="label-profession" className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider">Job Profession</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="ob-profession"
                        type="text"
                        placeholder="e.g. Lead Analyst, Growth Engineer, Sales Operations Manager"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        required
                        className="w-full h-8 bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-lg pl-8.5 pr-3 text-[11px] text-white focus:outline-none focus:border-zinc-600 transition-all duration-150"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 col-span-2 text-left">
                    <label id="label-team" className="text-zinc-500 font-medium text-[10px] uppercase tracking-wider">Team / Organization Details</label>
                    <div className="relative">
                      <Users className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="ob-team"
                        type="text"
                        placeholder="e.g. Lead Generation & Market Intelligence Squad"
                        value={teamDetails}
                        onChange={(e) => setTeamDetails(e.target.value)}
                        required
                        className="w-full h-8 bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800 rounded-lg pl-8.5 pr-3 text-[11px] text-white focus:outline-none focus:border-zinc-600 transition-all duration-150"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action feet */}
              <div className="shrink-0 pt-4 flex items-center justify-between gap-3 border-t border-zinc-900 mt-5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 shrink-0 animate-pulse text-emerald-450" />
                  <span>Redeem 100 free credits!</span>
                </div>
                <button
                  id="onboard-submit"
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-150 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 border-0"
                >
                  {loading ? "Claiming..." : "Collect 100 Credits"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Login / Registration UI
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans">
      {/* Background radial effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] sm:w-[500px] h-[280px] sm:h-[500px] rounded-full bg-zinc-900/40 blur-[150px] pointer-events-none -z-10" />

      {/* Brand logo container */}
      <div className="flex flex-col items-center mb-6 sm:mb-8 select-none text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shadow-2xl mb-3 text-white">
          <Bot className="w-6 h-6 animate-pulse" />
        </div>
        <h1 id="brand-title" className="text-lg font-bold tracking-tight text-white font-mono uppercase">FlowScrape</h1>
        <p className="text-zinc-500 text-xs mt-1 max-w-[280px] sm:max-w-none">High-Speed Visual Scraping Workspace & Automation Client</p>
      </div>

      {/* Login panel wrapper */}
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-2xl p-5 sm:p-8 relative overflow-hidden text-left transition-all duration-300">
        {/* Tab Swappers */}
        <div className="flex border-b border-zinc-900 mb-5 sm:mb-6 select-none">
          <button
            id="tab-login-trigger"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg("");
            }}
            className={`flex-1 pb-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${!isRegister ? "text-white border-b border-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Sign In
          </button>
          <button
            id="tab-register-trigger"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg("");
            }}
            className={`flex-1 pb-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${isRegister ? "text-white border-b border-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-950/40 border border-red-900/60 rounded-lg text-red-400 text-xs text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label id="field-username-label" className="text-zinc-500 font-medium text-[11px] uppercase tracking-wide">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-username"
                type="text"
                placeholder="asimkhan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 text-xs text-white focus:outline-none focus:border-zinc-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label id="field-password-label" className="text-zinc-500 font-medium text-[11px] uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 text-xs text-white focus:outline-none focus:border-zinc-500 focus:ring-0 transition-colors"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 transition-colors rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 select-none shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Interrogating Node Server..." : isRegister ? "Sign Up & Start Onboarding" : "Sign Into Workspace"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="text-center mt-6 text-[10px] text-zinc-650 font-mono">
        SECURE HANDSHAKE COMPILER V1.2 // MOCK SECURE DATABASE ACTIVE
      </div>
    </div>
  );
}
