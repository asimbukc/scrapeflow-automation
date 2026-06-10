// File Path: /src/app/api/workflows/route.js
import { NextResponse } from "next/server";
import { WorkflowRepository } from "@/lib/db/repository";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "anonymous";

    let list = await WorkflowRepository.findByOwner(username);

    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Missing workflow name" }, { status: 400 });
    }

    const owner = username ? username.toLowerCase() : "anonymous";
    const uuid = 'wf-' + Math.random().toString(36).substr(2, 9);
    
    const newWf = {
      id: uuid,
      name,
      description: description || "Custom scraper recipe.",
      trigger: "Manual",
      credits: 5,
      nodes: [
        { id: "node-launch", type: "launchBrowser", name: "LAUNCH BROWSER", x: 100, y: 150, data: { url: "https://example.com" } }
      ],
      edges: [],
      owner
    };

    const created = await WorkflowRepository.createWorkflow(newWf);
    return NextResponse.json(created);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { username, id, nodes, edges, credits, trigger } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing workflow ID" }, { status: 400 });
    }

    const updateFields = {};
    if (nodes) updateFields.nodes = nodes;
    if (edges) updateFields.edges = edges;
    if (credits !== undefined) updateFields.credits = credits;
    if (trigger !== undefined) updateFields.trigger = trigger;

    const updated = await WorkflowRepository.updateWorkflow(id, updateFields);
    if (!updated) {
      // If workflow was not found matching ID, we can create it on the fly
      const owner = username ? username.toLowerCase() : "anonymous";
      const userWorkflow = await WorkflowRepository.createWorkflow({
        id,
        name: "My Workflow",
        description: "Scraper workflow canvas setup",
        trigger: "Manual",
        credits: credits ?? 5,
        nodes: nodes || [],
        edges: edges || [],
        owner
      });
      return NextResponse.json(userWorkflow);
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing workflow ID parameter" }, { status: 400 });
    }

    await WorkflowRepository.deleteWorkflow(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
