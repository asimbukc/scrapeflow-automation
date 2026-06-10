import { NextResponse } from "next/server";
import { RunRepository } from "@/lib/db/repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "anonymous";

    const list = await RunRepository.findHistoricalByOwner(username);
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
