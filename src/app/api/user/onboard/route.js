// File Path: /src/app/api/user/onboard/route.js
import { NextResponse } from "next/server";
import { UserRepository } from "@/lib/db/repository";

/**
 * API ENDPOINT: POST /api/user/onboard
 * Updates onboarding preferences and details inside the Mongoose User document.
 */
export async function POST(request) {
  try {
    const { username, name, email, profession, teamDetails } = await request.json();
    if (!username) {
      return NextResponse.json({ error: "Missing username identifier" }, { status: 400 });
    }

    const updatedUser = await UserRepository.updateUser(username, {
      name: name || "",
      email: email || "",
      profession: profession || "",
      teamDetails: teamDetails || "",
      onboardingCompleted: true,
      credits: 100 // ensure base signup promo package is granted
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found for onboarding" }, { status: 404 });
    }

    return NextResponse.json({
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      profession: updatedUser.profession,
      teamDetails: updatedUser.teamDetails,
      onboardingCompleted: updatedUser.onboardingCompleted,
      credits: updatedUser.credits
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
