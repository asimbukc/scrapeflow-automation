'use client';

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  setActiveSubTab, 
  setSelectedWorkflow 
} from "@/store/slices/workflowsSlice";
import { setActiveRunId } from "@/store/slices/runsSlice";

import DashboardLayout from "@/components/DashboardLayout";
import WorkflowsList from "@/components/WorkflowsList";
import CreateWorkflowModal from "@/components/CreateWorkflowModal";
import WorkflowEditor from "@/components/WorkflowEditor";
import WorkflowRunDetails from "@/components/WorkflowRunDetails";

import { 
  useWorkflowsQuery, 
  useCreditsQuery,
  useCreateWorkflowMutation,
  useSaveWorkflowMutation,
  useDeleteWorkflowMutation,
  useTriggerRunMutation
} from "@/hooks/useQueries";

export default function WorkflowPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const { activeSubTab, selectedWorkflow } = useAppSelector((state) => state.workflows);
  const { activeRunId } = useAppSelector((state) => state.runs);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const username = user?.username || "";

  // Tanstack Query hooks
  const { data: workflows = [], refetch: refetchWorkflows } = useWorkflowsQuery(username);
  const { data: credits = 0 } = useCreditsQuery(username);

  // Mutations
  const createWorkflowMut = useCreateWorkflowMutation();
  const saveWorkflowMut = useSaveWorkflowMutation();
  const deleteWorkflowMut = useDeleteWorkflowMutation();
  const triggerRunMut = useTriggerRunMutation();

  const handleCreateWorkflow = async (name, description) => {
    try {
      const data = await createWorkflowMut.mutateAsync({
        username,
        name,
        description
      });
      dispatch(setSelectedWorkflow(data));
      dispatch(setActiveSubTab("editor"));
      setIsCreateModalOpen(false);
    } catch (err) {
      alert(err.message || "Failed to create workflow recipe");
    }
  };

  const handleSaveWorkflowNodes = async (id, nodes, edges, trigger) => {
    try {
      const componentWeights = nodes.reduce((acc, curr) => {
        switch (curr.type) {
          case "launchBrowser":
            return acc + 5;
          case "navigate":
            return acc + 2;
          case "getHtml":
            return acc + 2;
          case "extractAI":
            return acc + 4;
          default:
            return acc + 1;
        }
      }, 0);

      const data = await saveWorkflowMut.mutateAsync({
        username,
        id,
        nodes,
        edges,
        credits: componentWeights,
        trigger
      });
      dispatch(setSelectedWorkflow(data));
      return data;
    } catch (err) {
      alert(err.message || "Failed to save workflow");
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm("Are you sure you want to delete this workflow recipe?")) {
      return;
    }
    try {
      await deleteWorkflowMut.mutateAsync({ username, id });
      refetchWorkflows();
    } catch (err) {
      alert(err.message || "Failed to delete workflow");
    }
  };

  const handleRunWorkflow = async (wf) => {
    try {
      const activeRun = await triggerRunMut.mutateAsync({
        username,
        workflowId: wf.id,
        workflowName: wf.name,
        credits: wf.credits,
        nodes: wf.nodes
      });
      dispatch(setSelectedWorkflow(wf));
      dispatch(setActiveRunId(activeRun.id));
      dispatch(setActiveSubTab("runs"));
    } catch (err) {
      alert(err.message || "An error occurred starting execution.");
    }
  };

  return (
    <DashboardLayout activeTab="workflows" hideSidebar={!!selectedWorkflow}>
      <div className="flex-1 overflow-hidden relative flex flex-col h-full">
        {selectedWorkflow ? (
          /* Open visual editor view if workflow is active */
          <WorkflowEditor
            workflow={selectedWorkflow}
            runId={activeRunId || undefined}
            onBack={() => {
              dispatch(setSelectedWorkflow(null));
              refetchWorkflows();
            }}
            onSave={(nodes, edges, trigger) => handleSaveWorkflowNodes(selectedWorkflow.id, nodes, edges, trigger)}
            onExecute={(wf) => handleRunWorkflow(wf || selectedWorkflow)}
            activeSubTab={activeSubTab}
            onSubTabChange={(tab) => dispatch(setActiveSubTab(tab))}
          >
            <WorkflowRunDetails 
              workflow={selectedWorkflow} 
              activeRunId={activeRunId} 
              onSelectRunId={(id) => dispatch(setActiveRunId(id))}
            />
          </WorkflowEditor>
        ) : (
          /* Workflows List View */
          <WorkflowsList
            workflows={workflows}
            onCreateClick={() => setIsCreateModalOpen(true)}
            onEditClick={(wf) => {
              dispatch(setSelectedWorkflow(wf));
              dispatch(setActiveSubTab("editor"));
              dispatch(setActiveRunId(null));
            }}
            onRunClick={handleRunWorkflow}
            onDeleteClick={handleDeleteWorkflow}
            activeCredits={credits}
          />
        )}
      </div>

      {/* New Workflow Modal */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkflow}
      />
    </DashboardLayout>
  );
}
