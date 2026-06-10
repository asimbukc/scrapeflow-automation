// File Path: /src/app/api/user/credits/route.js
import { NextResponse } from "next/server";
import { UserRepository } from "@/lib/db/repository";

/**
 * API ENDPOINT: GET & POST /api/user/credits
 * Manages user balance credits by querying & writing directly to MongoDB.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
    }

    const user = await UserRepository.findByUsername(username);
    const credits = user ? (user.credits ?? 100) : 100;

    return NextResponse.json({ credits });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, amount, action } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username details" }, { status: 400 });
    }

    const value = parseInt(amount, 10) || 0;
    const updatedUser = await UserRepository.updateCredits(username, value, action);

    return NextResponse.json({ credits: updatedUser.credits });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
