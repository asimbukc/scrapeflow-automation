// File Path: /src/app/api/user/login/route.js
import { NextResponse } from "next/server";
import { UserRepository } from "@/lib/db/repository";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * API ENDPOINT: POST /api/user/login
 * Performs MongoDB lookups and validates the stored SHA256 password hash.
 */
export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const user = await UserRepository.findByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const hashedInput = hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      return NextResponse.json({ error: "Wrong credentials" }, { status: 401 });
    }

    // Return the authenticated database user record
    return NextResponse.json({
      username: user.username,
      name: user.name || (user.username.charAt(0).toUpperCase() + user.username.slice(1) + " Operator"),
      email: user.email || `${user.username}@flowscrape.io`,
      profession: user.profession || "Scraping Automation Specialist",
      teamDetails: user.teamDetails || "Production Default Team Node",
      onboardingCompleted: user.onboardingCompleted,
      credits: user.credits ?? 100,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
