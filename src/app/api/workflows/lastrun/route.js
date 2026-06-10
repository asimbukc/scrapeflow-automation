// File Path: /src/app/api/workflows/lastrun/route.js
import { NextResponse } from "next/server";
import { WorkflowRepository } from "@/lib/db/repository";

export async function POST(request) {
  try {
    const { username, id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing workflow ID or status" }, { status: 400 });
    }

    const updated = await WorkflowRepository.updateLastRun(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      lastRunStatus: updated.lastRunStatus,
      lastRunTime: updated.lastRunTime,
      message: "Workflow execution status updated successfully"
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
