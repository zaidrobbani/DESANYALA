export const isProduction = () =>
  process.env.NODE_ENV === "production" || process.env.APP_ENV === "prod";

export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL ?? "";

/**
 * Mock API aktif bila `NEXT_PUBLIC_USE_MOCK_API` bernilai "true",
 * atau bila base URL backend belum diisi.
 */
export const isMockApi = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true" || BASE_API_URL === "";

/**
 * Paksa hasil mock solver: "auto" (default, berdasarkan input),
 * "success", "fail" (skenario pertama infeasible), atau "fail-hybrid"
 * (baseline optimal, hybrid infeasible).
 */
export const MOCK_SOLVER_RESULT = (process.env.NEXT_PUBLIC_MOCK_SOLVER_RESULT ??
  "auto") as "auto" | "success" | "fail" | "fail-hybrid";
