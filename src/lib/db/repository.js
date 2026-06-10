import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Workflow from "@/models/Workflow";
import Credential from "@/models/Credential";
import Run from "@/models/Run";
import HistoricalRun from "@/models/HistoricalRun";
import RunFlow from "@/models/RunFlow";
import RunOutput from "@/models/RunOutput";
import StripeTransaction from "@/models/StripeTransaction";
import WorkflowResult from "@/models/WorkflowResult";


function sanitizeOutputs(outputs) {
  if (!outputs || typeof outputs !== 'object') return {};
  const cleaned = { ...outputs };
  for (const key of Object.keys(cleaned)) {
    if (key.toLowerCase().includes("html") || key === "extractedHtml") {
      delete cleaned[key];
    }
  }
  return cleaned;
}

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

export function resolveLastNodeResult(workflow, outputs) {
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


export const UserRepository = {
  async findByUsername(username) {
    if (!username) return null;
    await connectToDatabase();
    return await User.findOne({ username: username.toLowerCase() });
  },

  async createUser(data) {
    await connectToDatabase();
    const cleanData = {
      ...data,
      username: data.username.toLowerCase()
    };
    return await User.create(cleanData);
  },

  async updateUser(username, updateData) {
    if (!username) throw new Error("Missing username");
    await connectToDatabase();
    return await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  },

  async updateCredits(username, amount, action) {
    if (!username) throw new Error("Missing username");
    await connectToDatabase();
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) throw new Error("User not found");

    if (action === "purchase") {
      user.credits = (user.credits || 0) + amount;
    } else if (action === "deduct") {
      user.credits = Math.max(0, (user.credits || 0) - amount);
    }
    await user.save();
    return user;
  }
};

export const StripeTransactionRepository = {
  async findBySessionId(sessionId) {
    if (!sessionId) return null;
    await connectToDatabase();
    return await StripeTransaction.findOne({ sessionId });
  },

  async createTransaction(data) {
    await connectToDatabase();
    return await StripeTransaction.create(data);
  }
};

export const WorkflowResultRepository = {
  async findByWorkflowId(workflowId) {
    if (!workflowId) return [];
    await connectToDatabase();
    return await WorkflowResult.find({ workflowId }).sort({ createdAt: -1 });
  },

  async findByRunId(runId) {
    if (!runId) return null;
    await connectToDatabase();
    return await WorkflowResult.findOne({ runId });
  },

  async findByOwner(username) {
    if (!username) return [];
    await connectToDatabase();
    return await WorkflowResult.find({ owner: username.toLowerCase() }).sort({ createdAt: -1 });
  },

  async findAll() {
    await connectToDatabase();
    return await WorkflowResult.find({}).sort({ createdAt: -1 });
  },

  async createResult(data) {
    await connectToDatabase();
    return await WorkflowResult.findOneAndUpdate(
      { runId: data.runId },
      { $set: data },
      { upsert: true, new: true, returnDocument: 'after' }
    );
  }
};

export const WorkflowRepository = {
  async findByOwner(username) {
    if (!username) return [];
    await connectToDatabase();
    return await Workflow.find({ owner: username.toLowerCase() }).sort({ updatedAt: -1 });
  },

  async findById(id) {
    if (!id) return null;
    await connectToDatabase();
    return await Workflow.findOne({ id });
  },

  async createWorkflow(data) {
    await connectToDatabase();
    return await Workflow.create(data);
  },

  async updateWorkflow(id, updateData) {
    if (!id) throw new Error("Missing workflow ID");
    await connectToDatabase();
    return await Workflow.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true, returnDocument: 'after' }
    );
  },

  async updateLastRun(id, status) {
    if (!id) throw new Error("Missing workflow ID");
    await connectToDatabase();
    return await Workflow.findOneAndUpdate(
      { id },
      { 
        $set: { 
          lastRunStatus: status, 
          lastRunTime: new Date().toISOString() 
        } 
      },
      { returnDocument: 'after' }
    );
  },

  async deleteWorkflow(id) {
    if (!id) throw new Error("Missing workflow ID");
    await connectToDatabase();
    
    // 1. Retrieve all current runs of this workflow
    const associatedRuns = await Run.find({ workflowId: id });
    if (associatedRuns && associatedRuns.length > 0) {
      // 2. Upsert them into the historical collection to avoid duplicates
      for (const run of associatedRuns) {
        try {
          await HistoricalRun.findOneAndUpdate(
            { runId: run.id },
            {
              $set: {
                runId: run.id,
                owner: run.owner,
                startedAt: run.startedAt,
                workflowId: run.workflowId,
                workflowName: run.workflowName,
                status: run.status,
                durationMs: run.durationMs,
                creditsConsumed: run.creditsConsumed
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (err) {
          console.error("Failed to upsert historical run during workflow delete:", err);
        }
      }
      
      // 3. Completely delete the actual complex run runs under that workflow from primary collection
      const runIds = associatedRuns.map(run => run.id);
      await Run.deleteMany({ workflowId: id });
      await RunFlow.deleteMany({ runId: { $in: runIds } });
      await RunOutput.deleteMany({ runId: { $in: runIds } });
    }
    
    // 4. Delete the workflow document itself
    return await Workflow.deleteOne({ id });
  }
};

export const CredentialRepository = {
  async findByOwner(username) {
    if (!username) return [];
    await connectToDatabase();
    return await Credential.find({ owner: username.toLowerCase() }).sort({ createdAt: -1 });
  },

  async findById(id) {
    if (!id) return null;
    await connectToDatabase();
    return await Credential.findOne({ id });
  },

  async createCredential(data) {
    await connectToDatabase();
    return await Credential.create(data);
  },

  async deleteCredential(id) {
    if (!id) throw new Error("Missing credential ID");
    await connectToDatabase();
    return await Credential.deleteOne({ id });
  }
};

const runUpdateQueues = {};

async function queueRunUpdate(runId, updateFn) {
  if (!runUpdateQueues[runId]) {
    runUpdateQueues[runId] = Promise.resolve();
  }
  
  // Chain the new update function to the existing queue.
  // We use .catch(() => {}) so that if any previous update fails,
  // the subsequent update still runs in the correct sequence.
  const nextPromise = runUpdateQueues[runId]
    .catch(() => {})
    .then(async () => {
      return await updateFn();
    });
  
  runUpdateQueues[runId] = nextPromise;
  
  // Clean up when the promise completes to release memory
  nextPromise.finally(() => {
    if (runUpdateQueues[runId] === nextPromise) {
      delete runUpdateQueues[runId];
    }
  });

  return nextPromise;
}

export const RunRepository = {
  async findByOwner(username) {
    if (!username) return [];
    await connectToDatabase();
    const activeRuns = await Run.find({ owner: username.toLowerCase() }).lean();
    const historicalRuns = await HistoricalRun.find({ owner: username.toLowerCase() }).lean();
    
    const activeIds = new Set(activeRuns.map(r => r.id));
    
    // Map active runs with light placeholder structures for backwards safety
    const combined = activeRuns.map(r => ({
      ...r,
      phases: [],
      outputs: {}
    }));

    for (const hr of historicalRuns) {
      if (!activeIds.has(hr.runId)) {
        combined.push({
          id: hr.runId,
          owner: hr.owner,
          startedAt: hr.startedAt,
          status: hr.status,
          durationMs: hr.durationMs,
          creditsConsumed: hr.creditsConsumed,
          workflowId: hr.workflowId || "deleted-workflow",
          workflowName: hr.workflowName || "Deleted Workflow",
          phases: [],
          outputs: {}
        });
      }
    }

    combined.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    return combined;
  },

  async findHistoricalByOwner(username) {
    if (!username) return [];
    await connectToDatabase();
    return await HistoricalRun.find({ owner: username.toLowerCase() }).sort({ startedAt: -1 }).lean();
  },

  async findById(id) {
    if (!id) return null;
    await connectToDatabase();
    
    // 1. Fetch lightweight core Run or HistoricalRun metadata
    let run = await Run.findOne({ id }).lean();
    if (!run) {
      const hr = await HistoricalRun.findOne({ runId: id }).lean();
      if (hr) {
        run = {
          id: hr.runId,
          owner: hr.owner,
          startedAt: hr.startedAt,
          status: hr.status,
          durationMs: hr.durationMs,
          creditsConsumed: hr.creditsConsumed,
          workflowId: hr.workflowId || "deleted-workflow",
          workflowName: hr.workflowName || "Deleted Workflow",
        };
      }
    }

    if (!run) return null;

    // 2. Fetch corresponding phases (from RunFlow) and outputs (from RunOutput)
    const [flow, outDoc] = await Promise.all([
      RunFlow.findOne({ runId: id }).lean(),
      RunOutput.findOne({ runId: id }).lean()
    ]);

    // 3. Return unified object representation
    return {
      ...run,
      phases: flow ? (flow.phases || []) : [],
      outputs: outDoc ? (outDoc.outputs || {}) : {}
    };
  },

  async createRun(data) {
    await connectToDatabase();
    
    // Separate phases and outputs fields for RunFlow storage
    const { phases = [], outputs = {}, ...coreData } = data;
    
    // 1. Save core metadata to lightweight Run collection
    const run = await Run.create(coreData);
    
    // 2. Store detailed phases in separate RunFlow document, and outputs in RunOutput document
    try {
      await RunFlow.create({
        runId: coreData.id,
        phases
      });
    } catch (flowErr) {
      console.error("Failed to create RunFlow record during createRun:", flowErr);
    }

    const sanitizedOutputs = sanitizeOutputs(outputs);
    try {
      await RunOutput.create({
        runId: coreData.id,
        outputs: sanitizedOutputs
      });
    } catch (outErr) {
      console.error("Failed to create RunOutput record during createRun:", outErr);
    }

    // 3. Sync tracker HistoricalRun collection to avoid duplicates
    try {
      await HistoricalRun.findOneAndUpdate(
        { runId: coreData.id },
        {
          $set: {
            runId: coreData.id,
            owner: coreData.owner,
            startedAt: coreData.startedAt,
            workflowId: coreData.workflowId,
            workflowName: coreData.workflowName,
            status: coreData.status,
            durationMs: coreData.durationMs || 0,
            creditsConsumed: coreData.creditsConsumed || 0
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (err) {
      console.error("Failed to sync HistoricalRun on createRun:", err);
    }
    
    // Return complete representation so that caller doesn't break
    return {
      ...run.toObject(),
      phases,
      outputs: sanitizedOutputs
    };
  },

  async updatePhase(runId, phaseIndex, status, logAppend) {
    if (!runId) throw new Error("Missing run ID");
    
    return queueRunUpdate(runId, async () => {
      await connectToDatabase();
      const flow = await RunFlow.findOne({ runId });
      if (!flow) return null;

      if (flow.phases && flow.phases[phaseIndex]) {
        const idx = parseInt(phaseIndex, 10);
        flow.phases = flow.phases.map((phase, i) => {
          if (i === idx) {
            return {
              ...phase,
              status,
              log: (phase.log || "") + (logAppend || "")
            };
          }
          return phase;
        });
        flow.markModified('phases');
        await flow.save();
      }
      return flow;
    });
  },

  async finalizeRun(runId, status, durationMs, outputs) {
    if (!runId) throw new Error("Missing run ID");
    
    return queueRunUpdate(runId, async () => {
      await connectToDatabase();
      
      // Update primary collection lightweight attributes
      const updatedRun = await Run.findOneAndUpdate(
        { id: runId },
        { $set: { status, durationMs } },
        { returnDocument: 'after' }
      );

      // Update separate outputs fields in RunOutput collection
      try {
        await RunOutput.findOneAndUpdate(
          { runId },
          { $set: { outputs: sanitizeOutputs(outputs) } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (outErr) {
        console.error("Failed to update RunOutput outputs on finalizeRun:", outErr);
      }

      // Populate WorkflowResult for dedicated result fetching
      if (updatedRun) {
        try {
          const workflow = await Workflow.findOne({ id: updatedRun.workflowId });
          const lastNodeValue = resolveLastNodeResult(workflow, outputs);

          await WorkflowResult.findOneAndUpdate(
            { runId },
            {
              $set: {
                runId,
                workflowId: updatedRun.workflowId,
                workflowName: updatedRun.workflowName,
                owner: updatedRun.owner,
                status,
                result: lastNodeValue
              }
            },
            { upsert: true, returnDocument: 'after' }
          );
        } catch (resErr) {
          console.error("Failed to save WorkflowResult on finalizeRun:", resErr);
        }
      }

      // Maintain HistoricalRun log
      try {
        await HistoricalRun.findOneAndUpdate(
          { runId: runId },
          {
            $set: {
              status,
              durationMs
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("Failed to sync HistoricalRun on finalizeRun:", err);
      }
      return updatedRun;
    });
  }
};
