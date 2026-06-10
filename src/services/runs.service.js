// Connects frontend to the backend Node/Next-hosted server framework
// API Connection Details:
// 1. Get Runs: GET /api/runs (Line 12)
// 2. Get Run Details: GET /api/runs/detail (Line 23)
// 3. Create Run: POST /api/runs (Line 34)

export const runsService = {
  async getRuns(username) {
    try {
      // API: GET /api/runs?username={username}
      const res = await fetch(`/api/runs?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        return [];
      }
      return await res.json();
    } catch (err) {
      console.error("Failed to load user run history:", err);
      return [];
    }
  },

  async getHistoricalRuns(username) {
    try {
      // API: GET /api/runs/historical?username={username}
      const res = await fetch(`/api/runs/historical?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        return [];
      }
      return await res.json();
    } catch (err) {
      console.error("Failed to load user historical runs:", err);
      return [];
    }
  },

  async getRunById(username, runId) {
    try {
      // API: GET /api/runs/detail?username={username}&runId={runId}
      const res = await fetch(`/api/runs/detail?username=${encodeURIComponent(username)}&runId=${encodeURIComponent(runId)}`);
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error("Failed to load user run details:", err);
      return null;
    }
  },

  async createRun(username, workflowId, workflowName, creditsConsumed, nodes) {
    // API: POST /api/runs
    // Parameters: { username, workflowId, workflowName, creditsConsumed, nodes }
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, workflowId, workflowName, creditsConsumed, nodes })
    });
    const newRun = await res.json();
    if (!res.ok) {
      throw new Error(newRun.error || "Execution failed to initialize");
    }

    return newRun;
  }
};

