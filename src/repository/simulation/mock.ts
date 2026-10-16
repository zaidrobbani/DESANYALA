/*
 * Mock API simulasi — dipakai selama backend belum siap (lihat `isMockApi`).
 * State run disimpan di sessionStorage supaya halaman proses tetap jalan
 * setelah refresh. Hapus file ini setelah backend tersedia.
 */
import { MOCK_SOLVER_RESULT } from "@/lib/env";
import { ApiError } from "@/lib/try-catch";
import { formatNumber } from "@/shared/util/number";
import type {
  ScenarioKey,
  ScenarioProgress,
  SimulationProgress,
  SimulationRequest,
  SolverLogLine,
} from "./dto";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------------ */
/* Run solver                                                               */
/* ------------------------------------------------------------------------ */

const STORAGE_PREFIX = "desanyala:mock-simulation:";
const SOLVER = { name: "HiGHS", version: "1.7", method: "LP", periods: 8760 };

const SCENARIO_LABEL: Record<ScenarioKey, string> = {
  diesel_only: "Diesel-only (baseline)",
  pv_diesel: "PV + diesel",
  pv_diesel_battery: "PV + diesel + baterai",
};

/** Durasi solve per skenario (detik) di mock. */
const SCENARIO_DURATION: Record<ScenarioKey, number> = {
  diesel_only: 3.1,
  pv_diesel: 6.4,
  pv_diesel_battery: 10.8,
};
const INFEASIBLE_AFTER_SECONDS = 2.4;
const GAP_BETWEEN_SCENARIOS = 0.1;

type MockRun = {
  id: string;
  started_at: number;
  cancelled_at: number | null;
  scenarios: ScenarioKey[];
  /** Skenario yang dibuat gagal (infeasible), atau null. */
  failing_scenario: ScenarioKey | null;
  failure_reason: string | null;
};

const storage = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

const readRun = (id: string): MockRun | null => {
  try {
    const raw = storage()?.getItem(STORAGE_PREFIX + id);
    return raw ? (JSON.parse(raw) as MockRun) : null;
  } catch {
    return null;
  }
};

const writeRun = (run: MockRun) => {
  try {
    storage()?.setItem(STORAGE_PREFIX + run.id, JSON.stringify(run));
  } catch {
    // sessionStorage penuh / diblokir: mock tetap jalan selama halaman hidup.
  }
};

/*
 * Daya terpasang = semua peralatan menyala bersamaan. Ini batas atas beban
 * puncak, bukan profil per jam (yang masih harus dibentuk backend).
 */
const connectedPowerKw = (request: SimulationRequest) =>
  request.demand.loads.reduce(
    (sum, load) => sum + (load.quantity * load.power_w) / 1000,
    0,
  );

const resolveFailure = (request: SimulationRequest) => {
  const firstScenario = request.optimization.scenarios[0]?.id ?? "diesel_only";
  if (MOCK_SOLVER_RESULT === "success") return null;
  if (MOCK_SOLVER_RESULT === "fail") {
    return {
      scenario: firstScenario,
      reason:
        "Constraint keseimbangan energi tidak terpenuhi (mode mock: fail).",
    };
  }

  const { generators, reliability } = request;
  const dieselCapacity = generators.unit_count * generators.rated_power_each_kw;
  const peak = connectedPowerKw(request);
  if (
    request.optimization.scenarios.some(({ id }) => id === "diesel_only") &&
    reliability.shortage_policy === "forbid" &&
    dieselCapacity < peak
  ) {
    return {
      scenario: "diesel_only" as const,
      reason: `Daya terpasang peralatan ${formatNumber(peak, 2, 2)} kW melebihi kapasitas genset ${formatNumber(dieselCapacity)} kW, sementara kekurangan listrik tidak diizinkan.`,
    };
  }
  return null;
};

export const mockCreateSimulation = async (request: SimulationRequest) => {
  await delay(500);
  const failure = resolveFailure(request);
  const run: MockRun = {
    id: `sim_${Math.random().toString(36).slice(2, 10)}`,
    started_at: Date.now(),
    cancelled_at: null,
    scenarios: request.optimization.scenarios.map(({ id }) => id),
    failing_scenario: failure?.scenario ?? null,
    failure_reason: failure?.reason ?? null,
  };
  writeRun(run);
  return { payload: { id: run.id, status: "running" as const } };
};

export const mockCancelSimulation = async (id: string) => {
  await delay(300);
  const run = readRun(id);
  if (!run) throw new ApiError("Simulasi tidak ditemukan", { status: 404 });
  if (run.cancelled_at === null) {
    writeRun({ ...run, cancelled_at: Date.now() });
  }
};

const runningLogs = (elapsed: number): SolverLogLine[] => {
  const lines: SolverLogLine[] = [];
  if (elapsed >= 0.4) {
    lines.push({
      level: "info",
      text: `Running ${SOLVER.name} ${SOLVER.version} (${SOLVER.method})`,
    });
  }
  if (elapsed >= 1.1) lines.push({ level: "info", text: "Presolving model" });
  if (elapsed >= 2.0) lines.push({ level: "info", text: "Solving ..." });
  return lines;
};

const formatSeconds = (seconds: number) => seconds.toFixed(1);

export const buildMockProgress = (run: MockRun, now: number) => {
  const endTime = run.cancelled_at ?? now;
  const elapsed = Math.max(0, (endTime - run.started_at) / 1000);

  const scenarios: ScenarioProgress[] = [];
  const logs: SolverLogLine[] = [];
  let cursor = 0;
  let status: SimulationProgress["status"] = "completed";
  let currentIndex = run.scenarios.length;
  let error: SimulationProgress["error"] = null;

  run.scenarios.forEach((key, index) => {
    const base = {
      key,
      code: `Skenario ${String.fromCharCode(65 + index)}`,
      label: SCENARIO_LABEL[key],
    };

    // Skenario setelah kegagalan/pembatalan, atau yang belum mulai.
    if (status !== "completed" || elapsed < cursor) {
      if (status === "completed") {
        // Jeda singkat sebelum skenario berikutnya mulai.
        status = run.cancelled_at !== null ? "cancelled" : "running";
        currentIndex = index + 1;
      }
      scenarios.push({
        ...base,
        status: status === "running" ? "pending" : "skipped",
        progress: 0,
        duration_seconds: null,
      });
      return;
    }

    const willFail = run.failing_scenario === key;
    const duration = willFail
      ? INFEASIBLE_AFTER_SECONDS
      : SCENARIO_DURATION[key];
    const local = elapsed - cursor;

    logs.push({ level: "command", text: `> run_scenario("${key}")` });

    if (local < duration) {
      const cancelled = run.cancelled_at !== null;
      logs.push(...runningLogs(local));
      if (cancelled) logs.push({ level: "error", text: "Dibatalkan pengguna" });
      scenarios.push({
        ...base,
        status: cancelled ? "cancelled" : "running",
        progress: Math.min(0.95, (local / duration) * 0.95),
        duration_seconds: null,
      });
      status = cancelled ? "cancelled" : "running";
      currentIndex = index + 1;
      return;
    }

    if (willFail) {
      logs.push(...runningLogs(duration));
      logs.push({
        level: "error",
        text: `Model status  : Infeasible   (${formatSeconds(duration)} s)`,
      });
      if (run.failure_reason) {
        logs.push({ level: "error", text: run.failure_reason });
      }
      scenarios.push({
        ...base,
        status: "infeasible",
        progress: 1,
        duration_seconds: duration,
      });
      status = "failed";
      currentIndex = index + 1;
      error = {
        code: "INFEASIBLE",
        message: run.failure_reason ?? "Model tidak memiliki solusi feasible.",
      };
      return;
    }

    logs.push({
      level: "success",
      text: `Model status  : Optimal   (${formatSeconds(duration)} s)`,
    });
    scenarios.push({
      ...base,
      status: "optimal",
      progress: 1,
      duration_seconds: duration,
    });
    cursor += duration + GAP_BETWEEN_SCENARIOS;
  });

  return {
    id: run.id,
    status,
    current_scenario_index: Math.min(currentIndex, run.scenarios.length),
    total_scenarios: run.scenarios.length,
    elapsed_seconds:
      status === "completed"
        ? Math.max(0, cursor - GAP_BETWEEN_SCENARIOS)
        : elapsed,
    solver: SOLVER,
    scenarios,
    logs,
    error,
  } satisfies SimulationProgress;
};

export const mockGetSimulationProgress = async (id: string) => {
  await delay(120);
  const run = readRun(id);
  if (!run) {
    throw new ApiError("Simulasi tidak ditemukan atau sesi sudah berakhir.", {
      code: "NOT_FOUND",
      status: 404,
    });
  }
  return { payload: buildMockProgress(run, Date.now()) };
};
