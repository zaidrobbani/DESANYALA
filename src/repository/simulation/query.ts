import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CancelSimulation,
  CreateSimulation,
  GetLoadProfilePresets,
  GetSimulationProgress,
  GetSimulationResult,
} from "./action";
import type {
  LoadProfilePresetListResponse,
  SimulationCreateResponse,
  SimulationProgressResponse,
  SimulationRequest,
  SimulationResultResponse,
  SimulationStatus,
} from "./dto";

export const simulationKeys = {
  all: ["simulations"] as const,
  presets: () => ["load-profile-presets"] as const,
  progress: (id: string) => ["simulations", id, "progress"] as const,
  result: (id: string) => ["simulations", id, "result"] as const,
};

const POLLING_STATUSES: SimulationStatus[] = ["queued", "running"];

export const useGetLoadProfilePresets = () => {
  return useQuery<LoadProfilePresetListResponse, Error>({
    queryKey: simulationKeys.presets(),
    queryFn: GetLoadProfilePresets,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 1000 * 60 * 30,
  });
};

export const useCreateSimulation = () => {
  return useMutation<
    SimulationCreateResponse,
    Error,
    { payload: SimulationRequest; file: File | null }
  >({
    mutationFn: ({ payload, file }) => CreateSimulation(payload, file),
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
    retry: 1,
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
    retry: 1,
  });
};
