// File Path: /src/app/api/user/register/route.js
import { NextResponse } from "next/server";
import { UserRepository } from "@/lib/db/repository";
import crypto from "crypto";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * API ENDPOINT: POST /api/user/register
 * Hashes user password with SHA256 and inserts the record in MongoDB.
 */
export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const lowerUsername = username.toLowerCase().trim();

    // Check conflict
    const existing = await UserRepository.findByUsername(lowerUsername);
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // Create user record in MongoDB
    const newUser = await UserRepository.createUser({
      username: lowerUsername,
      passwordHash: hashedPassword,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      email: `${lowerUsername}@flowscrape.io`,
      onboardingCompleted: false,
      credits: 100, // standard promotional registration credits
    });

    return NextResponse.json({
      username: newUser.username,
      onboardingCompleted: newUser.onboardingCompleted,
      credits: newUser.credits
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
