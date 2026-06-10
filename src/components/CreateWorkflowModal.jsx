import { useState } from "react";
import { X, Layers2 } from "lucide-react";
export default function CreateWorkflowModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorWord, setErrorWord] = useState("");
  if (!isOpen) return null;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorWord("Name is required");
      return;
    }
    onSubmit(name.trim(), description.trim());
    setName("");
    setDescription("");
    setErrorWord("");
  };
  return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div className="bg-zinc-950 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col border border-zinc-800">
        
        {
    /* Close button */
  }
        <button
    onClick={onClose}
    className="absolute right-5 top-5 p-1 rounded-full text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
  >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col items-center">
          {
    /* Top double-diamond green icon stack */
  }
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 mb-4 shadow-sm">
            <Layers2 className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-white text-center">Create workflow</h2>
          <p className="text-xs text-zinc-400 mt-1 mb-6 text-center">Start building your workflow</p>

          <div className="w-full space-y-4 text-left">
            {
    /* Input Name */
  }
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1 uppercase tracking-wider font-mono">
                Name <span className="text-emerald-400 font-extrabold">(required)</span>
              </label>
              <input
    type="text"
    required
    value={name}
    onChange={(e) => {
      setName(e.target.value);
      if (errorWord) setErrorWord("");
    }}
    placeholder="eg: Amazon pricing scan"
    className={`w-full px-4 py-2.5 rounded-xl border ${errorWord ? "border-red-500 focus:ring-red-500/20" : "border-zinc-800 focus:ring-zinc-600 focus:border-zinc-700"} bg-zinc-900 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all`}
  />
              <p className="text-[10px] text-zinc-500 mt-1">Choose a descriptive and unique name</p>
              {errorWord && <span className="text-xs font-semibold text-red-400 mt-1 block">{errorWord}</span>}
            </div>

            {
    /* Input Description */
  }
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                Description <span className="text-zinc-600 font-normal lowercase">(optional)</span>
              </label>
              <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    placeholder="Describe what this scraper or automation rule does..."
    rows={3}
    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 transition-all resize-none"
  />
              <p className="text-[10px] text-zinc-500 mt-1">
                Provide a brief description of what your workflow does. This is optional but can help you remember the workflow's purpose
              </p>
            </div>
          </div>

          {
    /* Proceed Button */
  }
          <button
    type="submit"
    className="w-full mt-8 py-3 bg-white hover:bg-zinc-200 text-black text-xs font-bold font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer"
  >
            Create & Open Editor
          </button>
        </form>
      </div>
    </div>;
}
