import { axiosPublic } from "@/lib/axios";
import { isMockApi } from "@/lib/env";
import { tryCatch } from "@/lib/try-catch";
import type {
  SimulationCreateResponse,
  SimulationProgressResponse,
  SimulationRequest,
} from "./dto";
import {
  mockCancelSimulation,
  mockCreateSimulation,
  mockGetSimulationProgress,
} from "./mock";

export const CreateSimulation = async (
  payload: SimulationRequest,
): Promise<SimulationCreateResponse> => {
  if (isMockApi()) return mockCreateSimulation(payload);

  const { data, error } = await tryCatch(
    axiosPublic.post<SimulationCreateResponse>("/simulations", payload),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal menjalankan optimasi");
  }

  return data.data;
};

export const GetSimulationProgress = async (
  id: string,
): Promise<SimulationProgressResponse> => {
  if (isMockApi()) return mockGetSimulationProgress(id);

  const { data, error } = await tryCatch(
    axiosPublic.get<SimulationProgressResponse>(
      `/simulations/${encodeURIComponent(id)}/progress`,
    ),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal memuat progres solver");
  }

  return data.data;
};

export const CancelSimulation = async (id: string): Promise<void> => {
  if (isMockApi()) return mockCancelSimulation(id);

  const { error } = await tryCatch(
    axiosPublic.post(`/simulations/${encodeURIComponent(id)}/cancel`),
  );

  if (error) {
    throw error;
  }
};
