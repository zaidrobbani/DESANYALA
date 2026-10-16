import { axiosPublic } from "@/lib/axios";
import { isMockApi, OPTIMIZATION_TIMEOUT_MS } from "@/lib/env";
import { tryCatch } from "@/lib/try-catch";
import type {
  HealthResponse,
  InputValidationResponse,
  OptimizationResponse,
  SimulationCreateResponse,
  SimulationInputResponse,
  SimulationProgressResponse,
  SimulationRequest,
  SimulationResultResponse,
} from "./dto";
import { mockRunOptimization, mockValidateInput } from "./mock";
import {
  cancelRun,
  getRunInput,
  getRunProgress,
  getRunResult,
  startRun,
} from "./run-store";

/* ------------------------------------------------------------------------ */
/* Endpoint backend                                                         */
/* ------------------------------------------------------------------------ */

export const GetHealth = async (): Promise<HealthResponse> => {
  const { data, error } = await tryCatch(
    axiosPublic.get<HealthResponse>("/health"),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal memeriksa status backend");
  }

  return data.data;
};

/** POST /api/v1/inputs/validate: validasi kontrak + estimasi energi. */
export const ValidateSimulationInput = async (
  payload: SimulationRequest,
): Promise<InputValidationResponse> => {
  if (isMockApi()) return mockValidateInput(payload);

  const { data, error } = await tryCatch(
    axiosPublic.post<InputValidationResponse>(
      "/api/v1/inputs/validate",
      payload,
    ),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal memvalidasi input");
  }

  return data.data;
};

/** POST /api/v1/optimizations: menjalankan semua skenario (sinkron). */
export const RunOptimization = async (
  payload: SimulationRequest,
  signal?: AbortSignal,
): Promise<OptimizationResponse> => {
  const { data, error } = await tryCatch(
    axiosPublic.post<OptimizationResponse>("/api/v1/optimizations", payload, {
      signal,
      timeout: OPTIMIZATION_TIMEOUT_MS,
    }),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal menjalankan optimasi");
  }

  return data.data;
};

/* ------------------------------------------------------------------------ */
/* Run lokal (lihat run-store.ts)                                           */
/* ------------------------------------------------------------------------ */

export const CreateSimulation = async (
  payload: SimulationRequest,
): Promise<SimulationCreateResponse> => {
  const run = startRun(
    payload,
    isMockApi() ? mockRunOptimization : RunOptimization,
  );
  return { payload: { id: run.id, status: run.status } };
};

export const GetSimulationProgress = async (
  id: string,
): Promise<SimulationProgressResponse> => ({ payload: getRunProgress(id) });

export const CancelSimulation = async (id: string): Promise<void> => {
  cancelRun(id);
};

export const GetSimulationResult = async (
  id: string,
): Promise<SimulationResultResponse> => ({ payload: getRunResult(id) });

export const GetSimulationInput = async (
  id: string,
): Promise<SimulationInputResponse> => ({ payload: getRunInput(id) });
