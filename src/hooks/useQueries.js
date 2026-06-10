import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowService } from "@/services/workflow.service";
import { credentialsService } from "@/services/credentials.service";
import { runsService } from "@/services/runs.service";
import { userService } from "@/services/user.service";

export function useWorkflowsQuery(username) {
  return useQuery({
    queryKey: ["workflows", username],
    queryFn: () => workflowService.getWorkflows(username),
    enabled: !!username,
  });
}

export function useCredentialsQuery(username) {
  return useQuery({
    queryKey: ["credentials", username],
    queryFn: () => credentialsService.getCredentials(username),
    enabled: !!username,
  });
}

export function useRunsQuery(username) {
  return useQuery({
    queryKey: ["runs", username],
    queryFn: () => runsService.getRuns(username),
    enabled: !!username,
    refetchInterval: (query) => {
      const runs = query.state.data;
      if (Array.isArray(runs) && runs.some((r) => r.status === "running")) {
        return 2500;
      }
      return false;
    }
  });
}

export function useCreditsQuery(username) {
  return useQuery({
    queryKey: ["credits", username],
    queryFn: () => userService.getCredits(username),
    enabled: !!username,
  });
}

export function useCreateWorkflowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      workflowService.createWorkflow(payload.username, payload.name, payload.description),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.username] });
    },
  });
}

export function useSaveWorkflowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      workflowService.saveWorkflow(payload.username, payload.id, payload.nodes, payload.edges, payload.credits, payload.trigger),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.username] });
    },
  });
}

export function useDeleteWorkflowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      workflowService.deleteWorkflow(payload.username, payload.id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.username] });
    },
  });
}

export function useAddCredentialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      credentialsService.addCredential(payload.username, payload.name, payload.type, payload.value),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credentials", variables.username] });
    },
  });
}

export function useDeleteCredentialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      credentialsService.deleteCredential(payload.username, payload.id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credentials", variables.username] });
    },
  });
}

export function usePurchaseCreditsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      userService.purchaseCredits(payload.username, payload.amount),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["credits", variables.username] });
    },
  });
}

export function useTriggerRunMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      runsService.createRun(payload.username, payload.workflowId, payload.workflowName, payload.credits, payload.nodes),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["runs", variables.username] });
      queryClient.invalidateQueries({ queryKey: ["credits", variables.username] });
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.username] });
    }
  });
}
