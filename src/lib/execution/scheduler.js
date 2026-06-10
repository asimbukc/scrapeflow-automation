import mongoose from "mongoose";

// Topological sort helper specifically robust against infinite cycles
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

const triggerIntervals = {
  "15 sec": 15000,
  "30 sec": 30000,
  "5 min": 5 * 60 * 1000,
  "30 min": 30 * 60 * 1000,
  "1 hour": 60 * 60 * 1000,
  "24 hours": 24 * 60 * 60 * 1000,
};

async function checkAndRunWorkflows() {
  try {
    const { connectToDatabase } = await import("@/lib/db");
    await connectToDatabase();
    
    // Dynamically retrieve repository and models to prevent compile-time circular loops
    const { RunRepository, WorkflowRepository } = await import("@/lib/db/repository");
    const { runWorkflowEngine } = await import("@/lib/execution/engine");

    const Workflow = mongoose.models.Workflow || (await import("@/models/Workflow")).default;
    const User = mongoose.models.User || (await import("@/models/User")).default;

    // Fetch all active scheduled workflows (which are not set to Manual)
    const workflows = await Workflow.find({
      trigger: { $ne: "Manual", $exists: true }
    });

    if (!workflows || workflows.length === 0) {
      return;
    }

    const now = Date.now();

    for (const wf of workflows) {
      const intervalMs = triggerIntervals[wf.trigger];
      if (!intervalMs) continue; // invalid trigger or manual

      const lastRun = wf.lastRunTime ? new Date(wf.lastRunTime).getTime() : 0;
      if (now - lastRun < intervalMs) {
        // Not enough time has elapsed
        continue;
      }

      console.log(`[Scheduler] Workflow "${wf.name}" (${wf.id}) trigger criteria hit for schedule interval "${wf.trigger}". Last run: ${wf.lastRunTime || 'never'}`);

      const owner = wf.owner || "anonymous";
      
      // Check user's operations credit balance
      const user = await User.findOne({ username: owner.toLowerCase() });
      const cost = wf.credits ?? 5;
      if (user && (user.credits ?? 100) < cost) {
        console.warn(`[Scheduler] Skipping execution for workflow "${wf.name}" due to insufficient operational credits (needed ${cost}, has ${user.credits ?? 100}).`);
        continue;
      }

      // Track last run time proactively to prevent race condition overlapping runs
      await WorkflowRepository.updateLastRun(wf.id, "running");

      // Sort nodes topologically
      let sortedNodes = wf.nodes || [];
      if (wf.edges && wf.edges.length > 0) {
        try {
          sortedNodes = topologicalSort(wf.nodes, wf.edges);
        } catch (sortErr) {
          console.error(`[Scheduler] Topological node sorting failed for scheduled run of ${wf.id}:`, sortErr);
        }
      }

      const phases = sortedNodes.map((node) => ({
        name: node.name || node.type.toUpperCase(),
        status: "pending",
        log: ""
      }));

      const runId = "scheduled-run-id-" + Math.random().toString(36).substr(2, 9);
      const newRunPayload = {
        id: runId,
        workflowId: wf.id,
        workflowName: wf.name,
        status: "running",
        startedAt: new Date().toISOString(),
        durationMs: 0,
        creditsConsumed: cost,
        phases,
        owner: owner.toLowerCase(),
        outputs: {}
      };

      // Register run in DB using repository
      await RunRepository.createRun(newRunPayload);

      // Fire engine execution in background
      runWorkflowEngine(owner, runId, sortedNodes, wf.id).catch((err) => {
        console.error(`[Scheduler] Engine execution background process error in scheduled run ${runId}:`, err);
      });
    }
  } catch (error) {
    console.error("[Scheduler] Error in checkAndRunWorkflows check tick loop:", error);
  }
}

let schedulerIntervalId = null;

export function startScheduler() {
  if (global.schedulerIntervalId) {
    console.log("[Scheduler] Background scheduler daemon is already running. Preventing duplicate instantiation.");
    return;
  }

  console.log("[Scheduler] Bootstrapping background scheduler daemon client loop...");
  
  // Run check tick immediately
  checkAndRunWorkflows();

  // Run every 4 seconds to inspect schedules
  schedulerIntervalId = setInterval(() => {
    checkAndRunWorkflows();
  }, 4000);

  global.schedulerIntervalId = schedulerIntervalId;
}

export function stopScheduler() {
  if (global.schedulerIntervalId) {
    clearInterval(global.schedulerIntervalId);
    global.schedulerIntervalId = null;
    schedulerIntervalId = null;
    console.log("[Scheduler] Background scheduler daemon has been gracefully stopped.");
  }
}
