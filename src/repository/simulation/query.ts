import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CancelSimulation,
  CreateSimulation,
  GetSimulationProgress,
} from "./action";
import type {
  SimulationCreateResponse,
  SimulationProgressResponse,
  SimulationRequest,
  SimulationStatus,
} from "./dto";

export const simulationKeys = {
  all: ["simulations"] as const,
  progress: (id: string) => ["simulations", id, "progress"] as const,
};

const POLLING_STATUSES: SimulationStatus[] = ["queued", "running"];

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
