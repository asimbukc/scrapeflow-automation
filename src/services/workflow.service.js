// Connects frontend to the backend Node/Next-hosted server framework
// API Connection Details:
// 1. Get Workflows: GET /api/workflows (Line 13)
// 2. Create Workflow: POST /api/workflows (Line 24)
// 3. Save Workflow: PUT /api/workflows (Line 38)
// 4. Delete Workflow: DELETE /api/workflows (Line 53)
// 5. Update Last Run: POST /api/workflows/lastrun (Line 66)

export const workflowService = {
  async getWorkflows(username) {
    // API: GET /api/workflows?username={username}
    // Parameters: username (query string)
    const res = await fetch(`/api/workflows?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load workflows");
    }
    return data;
  },

  async createWorkflow(username, name, description) {
    // API: POST /api/workflows
    // Parameters: { username, name, description }
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create workflow recipe");
    }
    return data;
  },

  async saveWorkflow(username, id, nodes, edges, credits, trigger) {
    // API: PUT /api/workflows
    // Parameters: { username, id, nodes, edges, credits, trigger }
    const res = await fetch("/api/workflows", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, id, nodes, edges, credits, trigger }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Specified workflow key was not located");
    }
    return data;
  },

  async deleteWorkflow(username, id) {
    // API: DELETE /api/workflows?username={username}&id={id}
    // Parameters: username, id (query string)
    const res = await fetch(`/api/workflows?username=${encodeURIComponent(username)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete workflow");
    }
  },

  async updateWorkflowLastRun(username, id, status) {
    // API: POST /api/workflows/lastrun
    // Parameters: { username, id, status }
    const res = await fetch("/api/workflows/lastrun", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, id, status })
    });
    if (!res.ok) {
      console.warn("Failed to update last run on backend workflow model");
    }
  }
};

