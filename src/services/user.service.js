// Connects frontend to the backend Node/Next-hosted server framework
// API Connection Details:
// 1. Login: POST /api/user/login (Lign 14)
// 2. Register: POST /api/user/register (Line 29)
// 3. Onboard: POST /api/user/onboard (Line 44)
// 4. Get Credits: GET /api/user/credits (Line 60)
// 5. Purchase Credits: POST /api/user/credits (Line 72)
// 6. Deduct Credits: POST /api/user/credits (Line 87)

export const userService = {
  async login(username, password) {
    // API: POST /api/user/login
    // Parameters: { username, password }
    const res = await fetch("/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Specified username key does not match active records");
    }
    return data;
  },

  async register(username, password) {
    // API: POST /api/user/register
    // Parameters: { username, password }
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Username already registered in sandbox cluster");
    }
    return data;
  },

  async onboard(username, name, email, profession, teamDetails) {
    // API: POST /api/user/onboard
    // Parameters: { username, name, email, profession, teamDetails }
    const res = await fetch("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, name, email, profession, teamDetails }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Target user sequence is invalid");
    }
    return data;
  },

  async getCredits(username) {
    // API: GET /api/user/credits?username={username}
    // Parameters: username (query string)
    const res = await fetch(`/api/user/credits?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (!res.ok) {
      return 0;
    }
    return data.credits ?? 0;
  },

  async purchaseCredits(username, amount) {
    // API: POST /api/user/credits
    // Parameters: { username, amount, action: "purchase" }
    const res = await fetch("/api/user/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount, action: "purchase" }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "User record mismatch during audit checkout");
    }
    return data.credits;
  },

  async deductCredits(username, amount) {
    // API: POST /api/user/credits
    // Parameters: { username, amount, action: "deduct" }
    const res = await fetch("/api/user/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, amount, action: "deduct" }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "User record mismatch during credit deduction");
    }
    return data.credits;
  }
};

