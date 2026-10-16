export const isProduction = () =>
  process.env.NODE_ENV === "production" || process.env.APP_ENV === "prod";

export const BASE_API_URL = (
  process.env.NEXT_PUBLIC_BASE_API_URL ?? ""
).replace(/\/+$/, "");

/**
 * Mock API aktif bila `NEXT_PUBLIC_USE_MOCK_API` bernilai "true",
 * atau bila base URL backend belum diisi.
 */
export const isMockApi = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || BASE_API_URL === "";

/**
 * Paksa hasil mock solver: "auto" (default, berdasarkan input), "success",
 * "fail" (semua skenario infeasible), "fail-partial" (skenario terakhir
 * infeasible), atau "error" (backend menolak request).
 */
export const MOCK_SOLVER_RESULT = (process.env.NEXT_PUBLIC_MOCK_SOLVER_RESULT ??
  "auto") as "auto" | "success" | "fail" | "fail-partial" | "error";

const parsedTimeout = Number(process.env.NEXT_PUBLIC_OPTIMIZATION_TIMEOUT_MS);

/** Batas waktu POST /api/v1/optimizations (default 15 menit). */
export const OPTIMIZATION_TIMEOUT_MS =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : 15 * 60 * 1000;
