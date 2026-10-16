import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CancelSimulation,
  CreateSimulation,
  GetSimulationInput,
  GetSimulationProgress,
  GetSimulationResult,
  ValidateSimulationInput,
} from "./action";
import type {
  InputValidationResponse,
  SimulationCreateResponse,
  SimulationInputResponse,
  SimulationProgressResponse,
  SimulationRequest,
  SimulationResultResponse,
  SimulationStatus,
} from "./dto";

export const simulationKeys = {
  all: ["simulations"] as const,
  progress: (id: string) => ["simulations", id, "progress"] as const,
  result: (id: string) => ["simulations", id, "result"] as const,
  input: (id: string) => ["simulations", id, "input"] as const,
};

const POLLING_STATUSES: SimulationStatus[] = ["queued", "running"];

export const useValidateSimulationInput = () => {
  return useMutation<InputValidationResponse, Error, SimulationRequest>({
    mutationFn: (payload) => ValidateSimulationInput(payload),
  });
};

export const useCreateSimulation = () => {
  return useMutation<SimulationCreateResponse, Error, SimulationRequest>({
    mutationFn: (payload) => CreateSimulation(payload),
  });
};

export const useGetSimulationProgress = (
  id: string,
  intervalMs: number = 1000,
) => {
  return useQuery<SimulationProgressResponse, Error>({
    queryKey: simulationKeys.progress(id),
    queryFn: () => GetSimulationProgress(id),
    enabled: !!id,
    staleTime: 0,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.payload.status;
      if (query.state.error) return false;
      return !status || POLLING_STATUSES.includes(status) ? intervalMs : false;
    },
    refetchIntervalInBackground: true,
  });
};

export const useCancelSimulation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => CancelSimulation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: simulationKeys.progress(id) });
    },
  });
};

export const useGetSimulationResult = (id: string) => {
  return useQuery<SimulationResultResponse, Error>({
    queryKey: simulationKeys.result(id),
    queryFn: () => GetSimulationResult(id),
    enabled: !!id,
    // Hasil run tidak berubah setelah solver selesai.
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
};

export const useGetSimulationInput = (id: string) => {
  return useQuery<SimulationInputResponse, Error>({
    queryKey: simulationKeys.input(id),
    queryFn: () => GetSimulationInput(id),
    enabled: !!id,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
};
