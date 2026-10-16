import { axiosPublic } from "@/lib/axios";
import { API_MODE, OPTIMIZATION_TIMEOUT_MS } from "@/lib/env";
import { ApiError, tryCatch } from "@/lib/try-catch";
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
  type OptimizationExecutor,
  startRun,
} from "./run-store";

/* ------------------------------------------------------------------------ */
/* Fallback ke mock FE (API_MODE = "auto")                                  */
/* ------------------------------------------------------------------------ */

/*
 * Hanya error sisi backend yang di-fallback: engine error, 5xx, jaringan,
 * timeout. Error input (422 validasi Pydantic, invalid_input) dan
 * pembatalan pengguna tetap diteruskan apa adanya.
 */
const canFallbackToMock = (error: unknown) => {
  if (API_MODE !== "auto") return false;
  if (!(error instanceof ApiError)) return true;
  return !["CANCELLED", "VALIDATION_ERROR", "invalid_input"].includes(
    error.code ?? "",
  );
};

/** Pesan panjang (mis. traceback) -> baris pertama … baris terakhir. */
const summarizeMessage = (message: string) => {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 2) return lines.join(" ");
  return `${lines[0]} … ${lines[lines.length - 1]}`;
};

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
  if (API_MODE === "mock") return mockValidateInput(payload);

  const { data, error } = await tryCatch(
    axiosPublic.post<InputValidationResponse>(
      "/api/v1/inputs/validate",
      payload,
    ),
  );

  if (error || !data?.data) {
    // Backend tidak terjangkau di mode auto: cukup validasi form FE.
    if (canFallbackToMock(error)) return mockValidateInput(payload);
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

/** Backend dulu; bila backend error, run yang sama dilanjutkan oleh mock FE. */
const runBackendWithFallback: OptimizationExecutor = async (
  request,
  signal,
  onFallback,
) => {
  try {
    return await RunOptimization(request, signal);
  } catch (error) {
    if (!canFallbackToMock(error)) throw error;
    const apiError =
      error instanceof ApiError ? error : new ApiError(String(error));
    onFallback({
      code: apiError.code ?? "REQUEST_FAILED",
      message: summarizeMessage(apiError.message),
    });
    return mockRunOptimization(request, signal);
  }
};

export const CreateSimulation = async (
  payload: SimulationRequest,
): Promise<SimulationCreateResponse> => {
  const run =
    API_MODE === "mock"
      ? startRun(payload, mockRunOptimization, "mock")
      : startRun(
          payload,
          API_MODE === "auto" ? runBackendWithFallback : RunOptimization,
          "backend",
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
