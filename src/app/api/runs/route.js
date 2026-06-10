// File Path: /src/app/api/runs/route.js
import { NextResponse } from "next/server";
import { RunRepository, UserRepository, WorkflowRepository } from "@/lib/db/repository";
import { runWorkflowEngine } from "@/lib/execution/engine";

function topologicalSort(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];
  
  const adjList = {};
  const inDegree = {};
  const nodeMap = new Map();
  
  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    adjList[node.id] = [];
    inDegree[node.id] = 0;
  });
  
  if (edges && edges.length > 0) {
    edges.forEach(edge => {
      const { source, target } = edge;
      if (adjList[source] && adjList[target] !== undefined) {
        adjList[source].push(target);
        inDegree[target]++;
      }
    });
  }
  
  const queue = [];
  const entryNodes = nodes.filter(node => inDegree[node.id] === 0);
  
  // Prioritize launchBrowser, then navigate, as entry points
  entryNodes.sort((a, b) => {
    const scoreA = a.type === "launchBrowser" ? 2 : (a.type === "navigate" ? 1 : 0);
    const scoreB = b.type === "launchBrowser" ? 2 : (b.type === "navigate" ? 1 : 0);
    return scoreB - scoreA;
  });
  
  entryNodes.forEach(node => {
    queue.push(node.id);
  });
  
  const sortedIds = [];
  while (queue.length > 0) {
    const currId = queue.shift();
    sortedIds.push(currId);
    
    const targets = adjList[currId] || [];
    targets.forEach(targetId => {
      inDegree[targetId]--;
      if (inDegree[targetId] === 0) {
        queue.push(targetId);
      }
    });
  }
  
  // Graceful cycle recovery - append cyclic/leftover nodes
  const sortedSet = new Set(sortedIds);
  const remainingNodes = nodes.filter(node => !sortedSet.has(node.id));
  const finalOrderedIds = [...sortedIds, ...remainingNodes.map(n => n.id)];
  
  return finalOrderedIds.map(id => nodeMap.get(id)).filter(Boolean);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "anonymous";

    const list = await RunRepository.findByOwner(username);
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, workflowId, workflowName, creditsConsumed, nodes } = await request.json();
    if (!username || !workflowId || !workflowName) {
      return NextResponse.json({ error: "Missing required run fields" }, { status: 400 });
    }

    const budget = parseInt(creditsConsumed, 10) || 0;

    // Check account credits first
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Authenticated operator user profile not found" }, { status: 404 });
    }

    if ((user.credits ?? 100) < budget) {
      return NextResponse.json({ error: "Insufficient operational credits. Please top up your sandbox account." }, { status: 403 });
    }

    let sortedNodes = nodes || [];
    try {
      const workflow = await WorkflowRepository.findById(workflowId);
      if (workflow && workflow.edges && workflow.edges.length > 0) {
        sortedNodes = topologicalSort(nodes || [], workflow.edges);
      }
    } catch (sortErr) {
      console.error("Topological node sorting failed:", sortErr);
    }

    const phases = sortedNodes.map((node) => ({
      name: node.name || node.type.toUpperCase(),
      status: "pending",
      log: ""
    }));

    const runId = "run-id-" + Math.random().toString(36).substr(2, 9);
    const newRun = {
      id: runId,
      workflowId,
      workflowName,
      status: "running",
      startedAt: new Date().toISOString(),
      durationMs: 0,
      creditsConsumed: budget,
      phases,
      owner: username.toLowerCase(),
      outputs: {}
    };

    const saved = await RunRepository.createRun(newRun);

    // Trigger true server-side workflow execution engine in the background with the topologically sorted nodes
    runWorkflowEngine(username, runId, sortedNodes, workflowId).catch((err) => {
      console.error("Workflow execution background process fatal error:", err);
    });

    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
