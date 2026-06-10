// File Path: /src/app/workflow/result/route.js
import { NextResponse } from "next/server";
import { WorkflowResultRepository, WorkflowRepository } from "@/lib/db/repository";

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
  
  const sortedSet = new Set(sortedIds);
  const remainingNodes = nodes.filter(node => !sortedSet.has(node.id));
  const finalOrderedIds = [...sortedIds, ...remainingNodes.map(n => n.id)];
  
  return finalOrderedIds.map(id => nodeMap.get(id)).filter(Boolean);
}

function getOutputKeyForType(nodeType) {
  switch (nodeType) {
    case "extractAI":
      return "lastAiExtraction";
    case "extractText":
    case "nestedJson":
    case "readJson":
      return "extractedText";
    case "launchBrowser":
    case "navigate":
    case "getHtml":
      return "extractedHtml";
    case "apiDelivery":
    case "webhook":
      return "apiResponse";
    default:
      return null;
  }
}

function resolveLastNodeResult(workflow, outputs) {
  if (!outputs) return null;

  let lastNode = null;
  if (workflow && workflow.nodes && workflow.nodes.length > 0) {
    try {
      const sorted = topologicalSort(workflow.nodes, workflow.edges || []);
      const contentNodes = sorted.filter(n => n && n.type !== "apiDelivery" && n.type !== "webhook");
      if (contentNodes.length > 0) {
        lastNode = contentNodes[contentNodes.length - 1];
      }
    } catch (e) {
      console.error("Error sorting nodes for last node extraction:", e);
    }
  }

  let finalKey = null;
  if (lastNode) {
    finalKey = getOutputKeyForType(lastNode.type);
  }

  let value = null;
  if (finalKey && outputs[finalKey] !== undefined) {
    value = outputs[finalKey];
  } else {
    const priorityKeys = [
      "apiResponse",
      "webhookResponse",
      "lastAiExtraction",
      "extractedText",
      "extractedHtml",
      "apiPayload",
      "webhookPayload"
    ];
    for (const key of priorityKeys) {
      if (outputs[key] !== undefined && outputs[key] !== null) {
        value = outputs[key];
        break;
      }
    }
  }

  if (value === null || value === undefined) {
    return null;
  }

  const extractItemsIfPresent = (val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const keys = Object.keys(val);
      const targetKeys = ["data", "items", "results", "records", "jobs", "posts"];
      for (const tKey of targetKeys) {
        const found = keys.find(k => k.toLowerCase() === tKey);
        if (found !== undefined && val[found] !== null && val[found] !== undefined) {
          return val[found];
        }
      }
    }
    return val;
  };

  // If already an object/array (which is not null)
  if (typeof value === "object") {
    return extractItemsIfPresent(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null) {
          return extractItemsIfPresent(parsed);
        }
      } catch (err) {
        // Failed parsing as JSON object/array
      }
    }
  }

  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const runId = searchParams.get("runId");
    const owner = searchParams.get("owner") || searchParams.get("username");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const raw = searchParams.get("raw") === "true";

    let results = [];

    if (runId) {
      const single = await WorkflowResultRepository.findByRunId(runId);
      results = single ? [single] : [];
    } else if (workflowId) {
      results = await WorkflowResultRepository.findByWorkflowId(workflowId);
    } else if (owner) {
      results = await WorkflowResultRepository.findByOwner(owner);
    } else {
      results = await WorkflowResultRepository.findAll();
    }

    if (results.length > limit) {
      results = results.slice(0, limit);
    }

    const workflowCache = new Map();
    const getWorkflowCached = async (wfId) => {
      if (!wfId) return null;
      if (workflowCache.has(wfId)) return workflowCache.get(wfId);
      try {
        const wf = await WorkflowRepository.findById(wfId);
        workflowCache.set(wfId, wf);
        return wf;
      } catch (err) {
        return null;
      }
    };

    let simplifiedResults = await Promise.all(
      results.map(async (record) => {
        if (record.result !== undefined && record.result !== null) {
          return {
            runId: record.runId,
            workflowId: record.workflowId,
            workflowName: record.workflowName,
            owner: record.owner,
            status: record.status,
            result: record.result,
            completedAt: record.createdAt
          };
        }
        const workflow = await getWorkflowCached(record.workflowId);
        const lastNodeResult = resolveLastNodeResult(workflow, record.outputs);
        return {
          runId: record.runId,
          workflowId: record.workflowId,
          workflowName: record.workflowName,
          owner: record.owner,
          status: record.status,
          result: lastNodeResult,
          completedAt: record.createdAt
        };
      })
    );

    // Only deliver results that are valid JSON objects or arrays
    simplifiedResults = simplifiedResults.filter(r => r.result !== null && r.result !== undefined);

    // If querying a single runId and raw is requested, return the direct output value
    if (runId) {
      if (simplifiedResults.length === 0) {
        return NextResponse.json({
          success: false,
          error: "Last node result was not valid JSON. Delivery did not work."
        }, { status: 400 });
      }
      const targetUnit = simplifiedResults[0];
      if (raw) {
        const payload = targetUnit.result;
        if (typeof payload === "object" && payload !== null) {
          return NextResponse.json(payload);
        }
        return new Response(payload === null ? "" : String(payload), {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
      return NextResponse.json(targetUnit);
    }

    return NextResponse.json(simplifiedResults);
  } catch (err) {
    console.error("Workflow result retrieval error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { runId, workflowId, variables } = body;

    let lastNodeResult = null;
    if (workflowId && variables) {
      try {
        const workflow = await WorkflowRepository.findById(workflowId);
        lastNodeResult = resolveLastNodeResult(workflow, variables);
      } catch (err) {
        console.error("POST method - error resolving last node result inside route:", err);
      }
    }

    if (lastNodeResult === null || lastNodeResult === undefined) {
      return NextResponse.json({
        success: false,
        error: "Last node result is not valid JSON. Delivery did not work."
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "API delivery payload ingested successfully.",
      runId: runId || null,
      workflowId: workflowId || null,
      result: lastNodeResult,
    });
  } catch (err) {
    console.error("Workflow result post-ingest error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
