// File Path: /src/app/api/runs/detail/route.js
import { NextResponse } from "next/server";
import { RunRepository } from "@/lib/db/repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");
    if (!runId) {
      return NextResponse.json({ error: "Missing runId parameter" }, { status: 400 });
    }

    const runResult = await RunRepository.findById(runId);
    if (!runResult) {
      return NextResponse.json({ error: "Execution run details not found in database" }, { status: 404 });
    }

    return NextResponse.json(runResult);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
