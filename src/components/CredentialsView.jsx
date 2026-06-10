import { useState, useEffect } from "react";
import { 
  Lock, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Plus, 
  Sparkles,
  Info,
  ChevronRight
} from "lucide-react";

export default function CredentialsView({ user }) {
  // Parse loggedIn user details from local storage as failover context
  const [currentUser] = useState(() => {
    if (user) return user;
    try {
      const u = localStorage.getItem("flowscrape_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal open state matching "+ Create" design from screenshot
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Credential Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("API_KEY"); // "API_KEY" | "PASSWORD" | "TOKEN" | "PROXY"
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibleMap, setVisibleMap] = useState({});

  // Fetch saved credentials
  const fetchSavedCredentials = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials", {
        headers: {
          "x-username": currentUser.username
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to load secure credentials");
      }
    } catch (err) {
      console.error("Credentials fetching failed:", err);
      setError("Failed to reach credentials server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedCredentials();
  }, [currentUser]);

  // Compute time ago dynamically e.g. "about 5 hours ago"
  const getTimeAgo = (createdAt) => {
    if (!createdAt) return "some time ago";
    const date = new Date(createdAt);
    const now = new Date();
    const differenceInSeconds = Math.floor((now - date) / 1000);

    if (differenceInSeconds < 60) {
      return "just now";
    }
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    if (differenceInMinutes < 60) {
      return `${differenceInMinutes} ${differenceInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    if (differenceInHours < 24) {
      return `about ${differenceInHours} ${differenceInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    const differenceInDays = Math.floor(differenceInHours / 24);
    if (differenceInDays === 1) {
      return "yesterday";
    }
    return `${differenceInDays} days ago`;
  };

  // Preset list for ChatGPT, Gemini, etc. to make initialization robust
  const keyPresets = [
    { label: "ChatGPT API Key", defaultName: "ChatGPT Key", type: "API_KEY" },
    { label: "Gemini API Key", defaultName: "Gemini Key", type: "API_KEY" },
    { label: "DeepSeek API Key", defaultName: "DeepSeek Key", type: "API_KEY" },
    { label: "Claude API Key", defaultName: "Claude Key", type: "API_KEY" },
    { label: "Amazon Password", defaultName: "Amazon password", type: "PASSWORD" },
    { label: "Proxy Server", defaultName: "Scraper Proxy", type: "PROXY" }
  ];

  const applyPreset = (preset) => {
    setName(preset.defaultName);
    setType(preset.type);
    setValue("");
  };

  // Add a new credential
  const handleAddCredential = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim() || !value.trim()) {
      setError("Please provide a valid key alias and credential value.");
      return;
    }

    const cleanName = name.replace(/[^a-zA-Z0-9\s_-]/g, "").trim();
    if (!cleanName) {
      setError("Credential name must contain alphabetic characters or numbers.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-username": currentUser.username
        },
        body: JSON.stringify({
          name: cleanName,
          type,
          value: value.trim()
        })
      });

      if (res.ok) {
        setName("");
        setValue("");
        setType("API_KEY");
        setIsCreateModalOpen(false);
        await fetchSavedCredentials();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to save credential configuration");
      }
    } catch (err) {
      console.error("Failed to post credential:", err);
      setError("Failed to transmit credential data safely.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a credential
  const handleDeleteCredential = async (id, credName) => {
    if (!currentUser) return;
    if (!confirm(`Are you sure you want to delete "${credName}"? Workflows referencing this alias will no longer be able to substitute its value.`)) {
      return;
    }

    setError(null);
    try {
      const res = await fetch(`/api/credentials/${id}`, {
        method: "DELETE",
        headers: {
          "x-username": currentUser.username
        }
      });

      if (res.ok) {
        await fetchSavedCredentials();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete credential");
      }
    } catch (err) {
      console.error("Deleting credential failed:", err);
      setError("Failed to delete the credential selection.");
    }
  };

  // Toggle visibility status
  const toggleVisibility = (id) => {
    setVisibleMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex-1 bg-black text-zinc-100 p-8 pb-24 overflow-y-auto font-sans relative text-left">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Status badge */}
        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-6 select-none font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-300">CREDENTIALS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800 text-zinc-400 font-mono text-[9px]">
              VAULT STATUS: SECURE
            </span>
          </div>
        </div>

        {/* Header Block matching visual flow page design exactly */}
        <div className="flex items-center justify-between mb-8 select-none">
          <div>
            <h1 className="text-3xl font-bold font-sans text-white tracking-tight">Credentials</h1>
            <p className="text-xs text-zinc-400 mt-1">Manage your credentials</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setName("");
              setValue("");
              setType("API_KEY");
              setIsCreateModalOpen(true);
            }}
            className="text-xs font-bold bg-white hover:bg-zinc-200 text-black px-4 py-2.5 rounded-md transition-colors shadow-lg shadow-white/5 cursor-pointer flex items-center gap-1"
          >
            Create credential
          </button>
        </div>

        {/* Global Error message box if any */}
        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-450 rounded-xl flex items-start gap-3 text-xs animate-head-shake">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Encryption alert banner matching the screenshot structure */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 flex gap-3.5 font-sans text-left">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-emerald-400 font-sans uppercase tracking-wider">
              Encryption
            </h3>
            <p className="text-zinc-400 text-xs font-sans">
              All information is securely encrypted, ensuring your data remains safe
            </p>
          </div>
        </div>

        {/* Credentials list mapping the exact cards design in the screenshot */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 select-none">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-450 animate-spin" />
            <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">LOADING SECURED VAULT...</span>
          </div>
        ) : credentials.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-900 p-12 text-center rounded-2xl max-w-md mx-auto space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">No Credentials Configured</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Configure parameters such as ChatGPT, Gemini, or API Delivery Endpoint URLs. Click "Create" on top to securely save your first credential keyring.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {credentials.map((cred) => {
              const isVisible = visibleMap[cred.id] || false;
              return (
                <div 
                  key={cred.id}
                  className="bg-[#0c0c0e] border border-zinc-900/90 hover:border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Circle lock icon container */}
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Lock className="w-4 h-4 stroke-[2.2px]" />
                    </div>

                    {/* Meta info of credential */}
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[15px] text-zinc-100 truncate">
                          {cred.name}
                        </span>
                        <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md border shrink-0 ${
                          cred.type === "API_KEY" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                          cred.type === "TOKEN" ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                          cred.type === "PASSWORD" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                          "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        }`}>
                          {cred.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">
                          {getTimeAgo(cred.createdAt)}
                        </span>
                        <span className="text-zinc-700">•</span>
                        {/* Interactive toggle switch for fast value reading */}
                        <button
                          type="button"
                          onClick={() => toggleVisibility(cred.id)}
                          className="text-[10px] text-zinc-400 hover:text-emerald-400 inline-flex items-center gap-1 cursor-pointer font-medium font-sans transition-colors"
                        >
                          {isVisible ? (
                            <>
                              <EyeOff className="w-3 h-3 text-zinc-500" /> Hide secret
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-zinc-500" /> View value
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right hand close / delete option conforming perfectly with visual box details */}
                  <div className="flex items-center gap-3">
                    {isVisible && (
                      <div className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-[11px] font-mono select-all text-zinc-300 hidden sm:block">
                        {cred.value}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCredential(cred.id, cred.name)}
                      className="w-10 h-10 rounded-lg bg-[#eb5757] hover:bg-red-650 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-sm"
                      title="Delete credential"
                    >
                      <X className="w-5 h-5 stroke-[2.5px]" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal Overlay matching the creation flow */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-[#0b0b0d] rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-900 flex flex-col overflow-hidden text-left">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/40">
                <div className="flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-base font-bold text-white font-sans">
                    Setup New Sandbox Secret
                  </span>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddCredential} className="p-6 space-y-5 text-left">
                
                {/* Visual Preset triggers for ChatGPT, Gemini, etc. */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    Dynamic Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {keyPresets.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className="px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-all text-zinc-300 bg-zinc-950 border-zinc-850 hover:border-emerald-500 hover:bg-emerald-500/10 active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 1: Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    Secret Parameter Name (Alias)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="eg: ChatGPT key, Gemini API Key"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-zinc-900 text-white placeholder-zinc-650 font-sans"
                  />
                  <p className="text-[10px] text-zinc-500 font-sans">
                    Workflows substitute values securely during runs via {"{{Name}}"}.
                  </p>
                </div>

                {/* Field 2: Type */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    Credential Format type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-zinc-900 text-white font-sans cursor-pointer"
                  >
                    <option value="API_KEY">API Key Overwrite (API_KEY)</option>
                    <option value="TOKEN">Authorization Header Token (TOKEN)</option>
                    <option value="PASSWORD">System Platform Password (PASSWORD)</option>
                    <option value="PROXY">Scylla/Headless Proxy Address (PROXY)</option>
                  </select>
                </div>

                {/* Field 3: Secret Value */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    Encrypted Secret Value
                  </label>
                  <input
                    type="password"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Provide your secret value or paste key here..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-zinc-900 text-white font-mono placeholder-zinc-600"
                  />
                </div>

                {/* Info Note */}
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex gap-2.5 text-[11px] leading-relaxed text-zinc-400 font-sans">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    All API keys are securely hashed on our backend and are never sent back to the browser unless explicitly authorized via a decrypted active crawl event.
                  </p>
                </div>

                {/* Actions Row */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-900 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-800 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all font-semibold text-sm text-white flex items-center gap-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Save Secret
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
