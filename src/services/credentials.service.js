// Connects frontend to the backend Node/Next-hosted server framework
// API Connection Details:
// 1. Get Credentials: GET /api/credentials (Line 11)
// 2. Add Credential: POST /api/credentials (Line 22)
// 3. Delete Credential: DELETE /api/credentials (Line 36)

export const credentialsService = {
  async getCredentials(username) {
    // API: GET /api/credentials?username={username}
    // Parameters: username (query string)
    const res = await fetch(`/api/credentials?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load credentials");
    }
    return data;
  },

  async addCredential(username, name, type, value) {
    // API: POST /api/credentials
    // Parameters: { username, name, type, value }
    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, type, value }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save credential token");
    }
    return data;
  },

  async deleteCredential(username, id) {
    // API: DELETE /api/credentials?username={username}&id={id}
    // Parameters: username, id (query string)
    const res = await fetch(`/api/credentials?username=${encodeURIComponent(username)}&id=${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to delete credential token");
    }
  }
};

