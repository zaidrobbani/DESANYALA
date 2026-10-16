/*
 * Run lokal untuk POST /api/v1/optimizations.
 *
 * Backend menjalankan semua skenario dalam satu request sinkron dan tidak
 * menyediakan endpoint progres, batal, atau hasil per id. Supaya alur
 * Input -> Proses -> Hasil tetap jalan, FE:
 *   1. membuat id run lokal dan menjalankan request di latar belakang,
 *   2. menurunkan progres dari waktu berjalan + status request,
 *   3. menyimpan input & respons di sessionStorage untuk halaman Hasil.
 *
 * Request yang sedang berjalan hanya hidup di memori tab. Bila halaman dimuat
 * ulang saat solver berjalan (mis. Safari iOS memuat ulang tab di latar
 * belakang), run dilanjutkan otomatis dari input yang tersimpan
 * (`resumeOrphanedRun`), bukan dianggap gagal.
 *
 * Setiap run mencatat sumbernya (`source`): backend, mock FE, atau mock FE
 * sebagai fallback karena backend error (lihat API_MODE di lib/env.ts).
 */
import { ApiError } from "@/lib/try-catch";
import { formatNumber } from "@/shared/util/number";
import type {
  DispatchPoint,
  OptimizationResponse,
  RunError,
  RunSource,
  ScenarioKey,
  ScenarioProgress,
  ScenarioResult,
  ScenarioRunStatus,
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
  SimulationStatus,
  SolverLogLine,
} from "./dto";

export type OptimizationExecutor = (
  request: SimulationRequest,
  signal: AbortSignal,
  /** Dipanggil saat backend gagal dan run beralih ke mock FE. */
  onFallback: (reason: RunError) => void,
) => Promise<OptimizationResponse>;

type StoredRun = {
  id: string;
  request: SimulationRequest;
  started_at: number;
  finished_at: number | null;
  status: SimulationStatus;
  response: OptimizationResponse | null;
  error: RunError | null;
  source: RunSource;
  fallback: RunError | null;
  /** Berapa kali run dilanjutkan setelah halaman dimuat ulang. */
  resumed: number;
};

const STORAGE_PREFIX = "desanyala:simulation-run:";

export const SCENARIO_LABEL: Record<ScenarioKey, string> = {
  diesel_only: "Diesel-only",
  pv_diesel: "PV + diesel",
  pv_diesel_battery: "PV + diesel + baterai",
};

/** Request yang sedang berjalan di tab ini. */
const controllers = new Map<string, AbortController>();
/** Respons lengkap (sessionStorage menyimpan versi ringkas). */
const responses = new Map<string, OptimizationResponse>();

const storage = () =>
  typeof window === "undefined" ? null : window.sessionStorage;

/* ------------------------------------------------------------------------ */
/* Persistensi                                                              */
/* ------------------------------------------------------------------------ */

/*
 * Dispatch 8.760 jam × 3 skenario terlalu besar untuk sessionStorage dalam
 * bentuk objek, jadi disimpan per kolom dengan angka dibulatkan.
 */
const DISPATCH_COLUMNS = [
  "demand_kw",
  "pv_kw",
  "generator_power_kw",
  "battery_charge_kw",
  "battery_discharge_kw",
  "battery_soc_kwh",
  "battery_soc_fraction",
  "excess_power_kw",
  "unmet_demand_kw",
] as const;

type DispatchColumn = (typeof DISPATCH_COLUMNS)[number];

type PackedDispatch = {
  timestamp: string[];
} & Record<DispatchColumn, (number | null)[]>;

type PackedScenario = Omit<ScenarioResult, "dispatch"> & {
  dispatch: PackedDispatch | null;
};

type PackedResponse = Omit<OptimizationResponse, "scenario_results"> & {
  scenario_results: PackedScenario[];
};

type PackedRun = Omit<StoredRun, "response"> & {
  response: PackedResponse | null;
};

const round = (value: number | null) =>
  value === null || !Number.isFinite(value)
    ? null
    : Math.round(value * 1e4) / 1e4;

const packDispatch = (rows: DispatchPoint[]): PackedDispatch => {
  const packed = {
    timestamp: rows.map((row) => row.timestamp),
  } as Partial<PackedDispatch>;
  for (const column of DISPATCH_COLUMNS) {
    packed[column] = rows.map((row) => round(row[column]));
  }
  return packed as PackedDispatch;
};

const unpackDispatch = (packed: PackedDispatch | null): DispatchPoint[] =>
  packed
    ? packed.timestamp.map((timestamp, index) => ({
        timestamp,
        demand_kw: packed.demand_kw[index] ?? 0,
        pv_kw: packed.pv_kw[index] ?? 0,
        generator_power_kw: packed.generator_power_kw[index] ?? 0,
        battery_charge_kw: packed.battery_charge_kw[index] ?? 0,
        battery_discharge_kw: packed.battery_discharge_kw[index] ?? 0,
        battery_soc_kwh: packed.battery_soc_kwh[index] ?? null,
        battery_soc_fraction: packed.battery_soc_fraction[index] ?? null,
        excess_power_kw: packed.excess_power_kw[index] ?? 0,
        unmet_demand_kw: packed.unmet_demand_kw[index] ?? 0,
      }))
    : [];

const packResponse = (
  response: OptimizationResponse,
  withDispatch: boolean,
): PackedResponse => ({
  ...response,
  scenario_results: response.scenario_results.map((scenario) => ({
    ...scenario,
    dispatch: withDispatch ? packDispatch(scenario.dispatch) : null,
  })),
});

const unpackResponse = (packed: PackedResponse): OptimizationResponse => ({
  ...packed,
  scenario_results: packed.scenario_results.map((scenario) => ({
    ...scenario,
    dispatch: unpackDispatch(scenario.dispatch),
  })),
});

const writeRun = (run: StoredRun) => {
  if (run.response) responses.set(run.id, run.response);
  const key = STORAGE_PREFIX + run.id;
  const toPacked = (withDispatch: boolean): PackedRun => ({
    ...run,
    response: run.response ? packResponse(run.response, withDispatch) : null,
  });
  try {
    storage()?.setItem(key, JSON.stringify(toPacked(true)));
  } catch {
    // Kuota penuh: simpan tanpa dispatch (ringkasan tetap bisa dibuka setelah
    // refresh, grafik hanya tersedia selama tab ini hidup).
    try {
      storage()?.setItem(key, JSON.stringify(toPacked(false)));
    } catch {
      // sessionStorage diblokir: run tetap hidup di memori tab ini.
    }
  }
};

const memoryRuns = new Map<string, StoredRun>();

const readRun = (id: string): StoredRun | null => {
  const inMemory = memoryRuns.get(id);
  if (inMemory) return inMemory;
  try {
    const raw = storage()?.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    const packed = JSON.parse(raw) as PackedRun;
    const run: StoredRun = {
      ...packed,
      // Run lama (sebelum ada `source`) selalu berasal dari mock.
      source: packed.source ?? "mock",
      fallback: packed.fallback ?? null,
      resumed: packed.resumed ?? 0,
      response:
        responses.get(id) ??
        (packed.response ? unpackResponse(packed.response) : null),
    };
    memoryRuns.set(id, run);
    return run;
  } catch {
    return null;
  }
};

const saveRun = (run: StoredRun) => {
  memoryRuns.set(run.id, run);
  writeRun(run);
};

/* ------------------------------------------------------------------------ */
/* Status                                                                   */
/* ------------------------------------------------------------------------ */

const SCENARIO_STATUS: Record<ScenarioResult["status"], ScenarioRunStatus> = {
  optimal: "optimal",
  feasible: "feasible",
  infeasible: "infeasible",
  error: "error",
  not_implemented: "error",
  queued: "pending",
  running: "running",
};

export const isUsableScenario = (scenario: ScenarioResult) =>
  scenario.status === "optimal" || scenario.status === "feasible";

/** Pesan kegagalan pertama dari respons, atau null bila semua bisa dipakai. */
const responseFailure = (response: OptimizationResponse): RunError | null => {
  const failed = response.scenario_results.find(
    (scenario) => !isUsableScenario(scenario),
  );
  if (!failed && response.scenario_results.length > 0) return null;
  if (!failed) {
    return {
      code: "EMPTY_RESULT",
      message: "Backend tidak mengembalikan hasil skenario.",
    };
  }
  const label = SCENARIO_LABEL[failed.scenario_id] ?? failed.scenario_name;
  const detail =
    failed.validation.solver_message ?? failed.validation.warnings[0] ?? "";
  return {
    code: failed.status.toUpperCase(),
    message: `${label} berstatus ${failed.status}.${detail ? ` ${detail}` : ""}`,
  };
};

const finishRun = (
  id: string,
  patch: Pick<StoredRun, "status" | "response" | "error">,
) => {
  const run = readRun(id);
  if (!run) return;
  // Pembatalan pengguna menang atas respons yang datang terlambat.
  if (run.status === "cancelled") return;
  saveRun({ ...run, ...patch, finished_at: Date.now() });
};

/* ------------------------------------------------------------------------ */
/* API run                                                                  */
/* ------------------------------------------------------------------------ */

const createRunId = () =>
  `run_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Jalankan executor untuk run yang sudah tersimpan berstatus "running". */
const launchRun = (run: StoredRun, execute: OptimizationExecutor) => {
  const controller = new AbortController();
  controllers.set(run.id, controller);

  const handleFallback = (reason: RunError) => {
    const current = readRun(run.id);
    if (current?.status !== "running") return;
    saveRun({ ...current, source: "mock_fallback", fallback: reason });
  };

  execute(run.request, controller.signal, handleFallback)
    .then((response) => {
      const failure = responseFailure(response);
      finishRun(run.id, {
        status: failure ? "failed" : "completed",
        response,
        error: failure,
      });
    })
    .catch((error: unknown) => {
      const apiError =
        error instanceof ApiError ? error : new ApiError(String(error));
      finishRun(run.id, {
        status: "failed",
        response: null,
        error: {
          code: apiError.code ?? "REQUEST_FAILED",
          message: apiError.message,
        },
      });
    })
    .finally(() => {
      // Hanya hapus controller milik eksekusi ini (bukan hasil resume baru).
      if (controllers.get(run.id) === controller) controllers.delete(run.id);
    });
};

export const startRun = (
  request: SimulationRequest,
  execute: OptimizationExecutor,
  source: Exclude<RunSource, "mock_fallback">,
) => {
  const run: StoredRun = {
    id: createRunId(),
    request,
    started_at: Date.now(),
    finished_at: null,
    status: "running",
    response: null,
    error: null,
    source,
    fallback: null,
    resumed: 0,
  };
  saveRun(run);
  launchRun(run, execute);
  return run;
};

/**
 * Run "running" tanpa request hidup di tab ini = halaman dimuat ulang di
 * tengah proses. Lanjutkan dengan executor sesuai sumbernya (mis. mock bila
 * run ini sudah fallback). Mengembalikan true bila run dilanjutkan.
 */
export const resumeOrphanedRun = (
  id: string,
  executorFor: (source: RunSource) => OptimizationExecutor,
) => {
  const run = readRun(id);
  if (!run || run.status !== "running" || controllers.has(id)) return false;
  const resumed: StoredRun = { ...run, resumed: run.resumed + 1 };
  saveRun(resumed);
  launchRun(resumed, executorFor(resumed.source));
  return true;
};

const notFound = () =>
  new ApiError("Simulasi tidak ditemukan atau sesi sudah berakhir.", {
    code: "NOT_FOUND",
    status: 404,
  });

export const cancelRun = (id: string) => {
  const run = readRun(id);
  if (!run) throw notFound();
  if (run.status !== "running") return;
  saveRun({
    ...run,
    status: "cancelled",
    finished_at: Date.now(),
    error: { code: "CANCELLED", message: "Dibatalkan pengguna." },
  });
  controllers.get(id)?.abort();
  controllers.delete(id);
};

export const getRunResult = (id: string): SimulationResult => {
  const run = readRun(id);
  if (!run) throw notFound();
  if (!run.response) {
    throw new ApiError(
      run.status === "running"
        ? "Solver belum selesai."
        : (run.error?.message ?? "Run ini tidak memiliki hasil."),
      {
        code: run.status === "running" ? "NOT_READY" : "NO_RESULT",
        status: 409,
      },
    );
  }
  return {
    id: run.id,
    input: run.request,
    response: run.response,
    source: run.source,
    fallback: run.fallback,
  };
};

export const getRunInput = (id: string): SimulationRequest => {
  const run = readRun(id);
  if (!run) throw notFound();
  return run.request;
};

/* ------------------------------------------------------------------------ */
/* Progres                                                                  */
/* ------------------------------------------------------------------------ */

/** Perkiraan kasar durasi engine per skenario untuk animasi progres. */
const expectedSeconds = (request: SimulationRequest) =>
  10 + 50 * (request.project.simulation_days / 365);

const runningProgress = (elapsed: number, expected: number) =>
  0.95 * (1 - Math.exp(-elapsed / expected));

const scenarioCode = (index: number) =>
  `Skenario ${String.fromCharCode(65 + index)}`;

const SOLVER_BY_SOURCE: Record<
  RunSource,
  Pick<SimulationProgress["solver"], "name" | "method">
> = {
  backend: { name: "Offgridders", method: "backend DesaNyala" },
  mock: { name: "Mock FE", method: "heuristik di browser" },
  mock_fallback: { name: "Mock FE", method: "fallback, backend error" },
};

const buildLogs = (
  run: StoredRun,
  periods: number,
  elapsed: number,
): SolverLogLine[] => {
  const keys = run.request.optimization.scenarios.map(({ id }) => id);
  const logs: SolverLogLine[] = [
    {
      level: "command",
      text:
        run.source === "mock"
          ? "> mock FE (backend tidak dipanggil)"
          : "> POST /api/v1/optimizations",
    },
    {
      level: "info",
      text: `Payload ${run.request.schema_version} · ${keys.length} skenario (${keys.join(", ")}) · ${run.request.project.simulation_days} hari / ${formatNumber(periods)} interval`,
    },
  ];
  if (run.fallback) {
    logs.push(
      {
        level: "error",
        text: `Backend gagal (${run.fallback.code}): ${run.fallback.message}`,
      },
      {
        level: "warning",
        text: "! Beralih ke mock FE. Angka hasil adalah heuristik, bukan Offgridders.",
      },
    );
  }
  if (run.resumed > 0) {
    logs.push({
      level: "warning",
      text: `! Halaman dimuat ulang saat proses berjalan; run dilanjutkan otomatis (${run.resumed}×).`,
    });
  }
  if (run.status === "running") {
    logs.push({
      level: "info",
      text:
        run.source !== "backend"
          ? "Mock FE menghitung skenario di browser…"
          : elapsed < 2
            ? "Mengirim konfigurasi ke backend…"
            : "Backend membentuk profil per jam dan menjalankan Offgridders…",
    });
    return logs;
  }

  const { response } = run;
  if (response) {
    logs.push({
      level: "info",
      text: `Respons diterima · run ${response.project_id} · status ${response.status}`,
    });
    for (const scenario of response.scenario_results) {
      const ok = isUsableScenario(scenario);
      logs.push({
        level: ok ? "success" : "error",
        text: `${(SCENARIO_LABEL[scenario.scenario_id] ?? scenario.scenario_name).padEnd(22)}: ${scenario.status}`,
      });
      if (!ok && scenario.validation.solver_message) {
        logs.push({ level: "error", text: scenario.validation.solver_message });
      }
    }
    const warnings = new Set([
      ...response.warnings,
      ...response.scenario_results.flatMap((s) => s.validation.warnings),
    ]);
    for (const warning of warnings) {
      logs.push({ level: "warning", text: `! ${warning}` });
    }
  }
  if (run.error && (run.status !== "failed" || !response)) {
    logs.push({
      level: "error",
      text: `${run.error.code}: ${run.error.message}`,
    });
  }
  return logs;
};

export const getRunProgress = (id: string, now = Date.now()) => {
  const run = readRun(id);
  if (!run) throw notFound();

  const { request, response } = run;
  const keys = request.optimization.scenarios.map(({ id: key }) => key);
  const elapsed = Math.max(
    0,
    ((run.finished_at ?? now) - run.started_at) / 1000,
  );
  const periods =
    (request.project.simulation_days * 24) / request.project.time_step_hours;

  const scenarios: ScenarioProgress[] = keys.map((key, index) => {
    const base = { key, code: scenarioCode(index), label: SCENARIO_LABEL[key] };
    if (run.status === "running") {
      return {
        ...base,
        status: "running",
        progress: runningProgress(elapsed, expectedSeconds(request)),
        duration_seconds: null,
      };
    }
    if (run.status === "cancelled") {
      return {
        ...base,
        status: "cancelled",
        progress: 0,
        duration_seconds: null,
      };
    }
    const result = response?.scenario_results.find(
      (scenario) => scenario.scenario_id === key,
    );
    if (!result) {
      return {
        ...base,
        status: response ? "skipped" : "error",
        progress: 0,
        duration_seconds: null,
      };
    }
    return {
      ...base,
      status: SCENARIO_STATUS[result.status],
      progress: 1,
      duration_seconds: null,
    };
  });

  return {
    id: run.id,
    status: run.status,
    current_scenario_index: keys.length,
    total_scenarios: keys.length,
    elapsed_seconds: elapsed,
    solver: { ...SOLVER_BY_SOURCE[run.source], periods },
    scenarios,
    logs: buildLogs(run, periods, elapsed),
    error: run.error,
    source: run.source,
    fallback: run.fallback,
  } satisfies SimulationProgress;
};
