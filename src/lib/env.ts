export const isProduction = () =>
  process.env.NODE_ENV === "production" || process.env.APP_ENV === "prod";

export const BASE_API_URL = (
  process.env.NEXT_PUBLIC_BASE_API_URL ?? ""
).replace(/\/+$/, "");

/**
 * Sumber hasil optimasi:
 * - "auto"    : coba backend; bila backend error (engine, 5xx, jaringan,
 *               timeout) run itu otomatis memakai mock FE.
 * - "backend" : selalu backend, error ditampilkan apa adanya.
 * - "mock"    : selalu mock FE, backend tidak dipanggil.
 * Base URL kosong selalu berarti "mock".
 */
export type ApiMode = "auto" | "backend" | "mock";

const rawApiMode = process.env.NEXT_PUBLIC_API_MODE;

export const API_MODE: ApiMode =
  BASE_API_URL === ""
    ? "mock"
    : rawApiMode === "backend" || rawApiMode === "mock"
      ? rawApiMode
      : "auto";

export const isMockApi = () => API_MODE === "mock";

/**
 * Paksa hasil mock solver: "auto" (default, berdasarkan input), "success",
 * "fail" (semua skenario infeasible), "fail-partial" (skenario terakhir
 * infeasible), atau "error" (mock menolak request).
 */
export const MOCK_SOLVER_RESULT = (process.env.NEXT_PUBLIC_MOCK_SOLVER_RESULT ??
  "auto") as "auto" | "success" | "fail" | "fail-partial" | "error";

const parsedTimeout = Number(process.env.NEXT_PUBLIC_OPTIMIZATION_TIMEOUT_MS);

/** Batas waktu POST /api/v1/optimizations (default 15 menit). */
export const OPTIMIZATION_TIMEOUT_MS =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : 15 * 60 * 1000;
