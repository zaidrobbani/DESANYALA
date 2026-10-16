/*
 * Mock API simulasi — dipakai selama backend belum siap (lihat `isMockApi`).
 * State run disimpan di sessionStorage supaya halaman proses tetap jalan
 * setelah refresh. Hapus file ini setelah backend tersedia.
 */
import { MOCK_SOLVER_RESULT } from "@/lib/env";
import { ApiError } from "@/lib/try-catch";
import { scaleLoadProfile } from "@/shared/util/load-profile";
import { formatNumber } from "@/shared/util/number";
import type {
  ComponentResult,
  HourlyDispatch,
  LoadProfilePreset,
  ScenarioKey,
  ScenarioProgress,
  ScenarioResult,
  SimulationProgress,
  SimulationRequest,
  SimulationResult,
  SolverLogLine,
} from "./dto";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Bentuk profil beban Yensawai diambil dari vektor grafik di Figma
 * (node 40:209), lalu diskalakan ke angka paper Subekti dkk. (2024):
 * 728,83 kWh/hari dan beban puncak 77,90 kW.
 */
const YENSAWAI_SHAPE = [
  14.21, 12.24, 11.25, 11.25, 12.24, 16.24, 26.21, 42.21, 56.24, 60.24, 50.21,
  38.21, 26.21, 20.24, 18.21, 18.21, 18.21, 23.25, 42.21, 78.12, 60.24, 38.21,
  24.24, 16.24,
];

/*
 * PLACEHOLDER — bukan data asli Balderrama dkk. (2019).
 * Ganti dengan profil dari repo Energy_2019 saat backend tersedia.
 */
const EL_ESPINO_PLACEHOLDER_SHAPE = [
  6, 5.5, 5, 5, 5.5, 7, 10, 12, 11, 10, 10, 11, 12, 11, 10, 10, 11, 14, 22, 28,
  26, 20, 13, 8,
];

export const MOCK_LOAD_PROFILE_PRESETS: LoadProfilePreset[] = [
  {
    id: "yensawai",
    name: "Yensawai, Raja Ampat",
    description:
      "Direkonstruksi dari angka paper. Diulang 365 hari, bukan pengukuran lapangan.",
    source: { label: "Rekonstruksi dari paper", tone: "assumption" },
    stats_source: { label: "Paper 2024", tone: "paper" },
    daily_energy_kwh: 728.83,
    peak_load_kw: 77.9,
    avg_irradiance_kwh_m2_day: 5.73,
    hourly_profile_kw: scaleLoadProfile(YENSAWAI_SHAPE, 728.83, 77.9),
    validation: {
      rows: 8760,
      interval_minutes: 60,
      unit: "kW",
      unit_consistent: true,
      negative_count: 0,
      interpolated_count: 2,
    },
  },
  {
    id: "el-espino",
    name: "El Espino, Bolivia",
    description: "Contoh repo Energy_2019 untuk uji reproduksi model.",
    source: { label: "Balderrama dkk. 2019", tone: "paper" },
    stats_source: { label: "Placeholder mock", tone: "assumption" },
    daily_energy_kwh: 300,
    peak_load_kw: 28,
    avg_irradiance_kwh_m2_day: 5.5,
    hourly_profile_kw: scaleLoadProfile(EL_ESPINO_PLACEHOLDER_SHAPE, 300, 28),
    validation: {
      rows: 8760,
      interval_minutes: 60,
      unit: "kW",
      unit_consistent: true,
      negative_count: 0,
      interpolated_count: 0,
    },
  },
];

export const mockGetLoadProfilePresets = async () => {
  await delay(250);
  return { payload: MOCK_LOAD_PROFILE_PRESETS };
};

/* ------------------------------------------------------------------------ */
/* Run solver                                                               */
/* ------------------------------------------------------------------------ */

const STORAGE_PREFIX = "desanyala:mock-simulation:";
const SOLVER = { name: "HiGHS", version: "1.7", method: "LP", periods: 8760 };

const SCENARIO_LABEL: Record<ScenarioKey, string> = {
  baseline: "Baseline: diesel saja",
  hybrid: "Hybrid: diesel + PV + baterai",
};

/** Durasi solve per skenario (detik) di mock. */
const SCENARIO_DURATION: Record<ScenarioKey, number> = {
  baseline: 3.1,
  hybrid: 10.8,
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
  /** Input saat run, dipakai untuk menyusun hasil. Kosong di sesi lama. */
  request?: SimulationRequest;
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

const resolvePeakLoad = (request: SimulationRequest) => {
  if (request.load.source === "manual") return request.load.peak_load_kw;
  const presetId = request.load.preset_id;
  return (
    MOCK_LOAD_PROFILE_PRESETS.find((preset) => preset.id === presetId)
      ?.peak_load_kw ?? 0
  );
};

const resolveFailure = (request: SimulationRequest) => {
  const firstScenario = request.scenarios[0] ?? "baseline";
  if (MOCK_SOLVER_RESULT === "success") return null;
  if (MOCK_SOLVER_RESULT === "fail") {
    return {
      scenario: firstScenario,
      reason:
        "Constraint keseimbangan energi tidak terpenuhi (mode mock: fail).",
    };
  }

  const dieselCapacity = request.diesel.units * request.diesel.unit_capacity_kw;
  const peak = resolvePeakLoad(request);
  if (
    request.scenarios.includes("baseline") &&
    request.max_unserved_energy_pct === 0 &&
    dieselCapacity < peak
  ) {
    return {
      scenario: "baseline" as const,
      reason: `Beban puncak ${formatNumber(peak, 2, 2)} kW melebihi kapasitas diesel ${formatNumber(dieselCapacity)} kW, sementara batas beban tak terlayani 0 %.`,
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
    scenarios: request.scenarios,
    failing_scenario: failure?.scenario ?? null,
    failure_reason: failure?.reason ?? null,
    request,
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

/* ------------------------------------------------------------------------ */
/* Hasil simulasi                                                           */
/* ------------------------------------------------------------------------ */

/*
 * PLACEHOLDER — angka biaya mengikuti mockup Figma (benchmark Subekti dkk.
 * 2024, kurs 16.300 Rp/USD), bukan output model. Kapasitas & biaya
 * investasi komponen dihitung dari harga satuan di input.
 */
const MOCK_COST: Record<
  ScenarioKey,
  Pick<
    ScenarioResult,
    "npc_idr" | "lcoe_idr_per_kwh" | "capex_idr" | "opex_idr_per_year"
  >
> = {
  baseline: {
    npc_idr: 14_180_000_000,
    lcoe_idr_per_kwh: 4564,
    capex_idr: 0,
    opex_idr_per_year: 1_210_000_000,
  },
  hybrid: {
    npc_idr: 11_900_000_000,
    lcoe_idr_per_kwh: 3847,
    capex_idr: 1_980_000_000,
    opex_idr_per_year: 855_000_000,
  },
};

const MOCK_HYBRID_SIZE = { pv_kwp: 70.1, battery_kwh: 80, inverter_kw: 30 };
/** Porsi energi tahunan yang dipasok skenario hybrid (%). */
const MOCK_HYBRID_SHARE = { pv: 29.6, diesel: 70.4 };

/*
 * Dispatch hari tipikal skenario hybrid, dibaca dari grafik Figma
 * (node 41:709): [diesel, PV, baterai discharge, baterai charge] kW.
 * Diskalakan per jam ke profil beban run.
 */
const MOCK_HYBRID_DISPATCH: [number, number, number, number][] = [
  [14, 0, 0, 0],
  [12, 0, 0, 0],
  [11, 0, 0, 0],
  [11, 0, 0, 0],
  [12, 0, 0, 0],
  [16, 0, 0, 0],
  [24, 2, 0, 0],
  [34, 8, 0, 0],
  [36, 20, 0, 0],
  [28, 32, 0, 0],
  [0, 41, 9, 0],
  [0, 38, 0, 8],
  [0, 26, 0, 22],
  [0, 20, 0, 24],
  [0, 18, 0, 19],
  [0, 18, 0, 9],
  [0, 15, 3, 0],
  [18, 5, 0, 0],
  [32, 0, 10, 0],
  [47.9, 0, 30, 0],
  [35, 0, 25, 0],
  [37, 0, 1, 0],
  [24, 0, 0, 0],
  [16, 0, 0, 0],
];

const round1 = (value: number) => Math.round(value * 10) / 10;

const resolveLoadProfile = (request: SimulationRequest) => {
  if (request.load.source === "manual") {
    const { daily_energy_kwh, peak_load_kw } = request.load;
    return {
      dailyEnergy: daily_energy_kwh,
      profile: scaleLoadProfile(YENSAWAI_SHAPE, daily_energy_kwh, peak_load_kw),
    };
  }
  const presetId = request.load.preset_id;
  const preset =
    MOCK_LOAD_PROFILE_PRESETS.find((item) => item.id === presetId) ??
    MOCK_LOAD_PROFILE_PRESETS[0];
  return {
    dailyEnergy: preset.daily_energy_kwh,
    profile: preset.hourly_profile_kw,
  };
};

const buildDispatch = (key: ScenarioKey, profile: number[]): HourlyDispatch[] =>
  profile.map((load, hour) => {
    if (key === "baseline") {
      return {
        hour,
        load_kw: load,
        diesel_kw: load,
        pv_kw: 0,
        battery_discharge_kw: 0,
        battery_charge_kw: 0,
      };
    }
    const [diesel, pv, discharge, charge] = MOCK_HYBRID_DISPATCH[hour];
    const served = diesel + pv + discharge;
    const factor = served > 0 ? load / served : 0;
    return {
      hour,
      load_kw: load,
      diesel_kw: round1(diesel * factor),
      pv_kw: round1(pv * factor),
      battery_discharge_kw: round1(discharge * factor),
      battery_charge_kw: round1(charge * factor),
    };
  });

const buildMockResult = (
  run: MockRun,
  request: SimulationRequest,
): SimulationResult => {
  const { dailyEnergy, profile } = resolveLoadProfile(request);
  const servedPerYear = dailyEnergy * 365;
  const sfc = request.diesel.specific_consumption_l_per_kwh;

  const scenarios = run.scenarios.map(
    (key): ScenarioResult => ({
      key,
      label: SCENARIO_LABEL[key],
      solve_seconds: SCENARIO_DURATION[key],
      ...MOCK_COST[key],
      fuel_liters_per_year:
        servedPerYear *
        sfc *
        (key === "hybrid" ? MOCK_HYBRID_SHARE.diesel / 100 : 1),
      served_energy_kwh_per_year: servedPerYear,
      unserved_energy_pct: 0,
      typical_day_dispatch: buildDispatch(key, profile),
    }),
  );

  const pvKwp = Math.min(MOCK_HYBRID_SIZE.pv_kwp, request.pv.max_capacity_kwp);
  const batteryKwh = Math.min(
    MOCK_HYBRID_SIZE.battery_kwh,
    request.battery.max_capacity_kwh,
  );
  const { economics } = request;
  const components: ComponentResult[] = [
    {
      key: "pv",
      units: 1,
      unit_capacity: pvKwp,
      unit: "kWp",
      is_existing: false,
      investment_idr: pvKwp * economics.capex_pv_idr_per_kwp,
      energy_share_pct: MOCK_HYBRID_SHARE.pv,
    },
    {
      key: "battery",
      units: 1,
      unit_capacity: batteryKwh,
      unit: "kWh",
      is_existing: false,
      investment_idr: batteryKwh * economics.capex_battery_idr_per_kwh,
      energy_share_pct: null,
    },
    {
      key: "inverter",
      units: 1,
      unit_capacity: MOCK_HYBRID_SIZE.inverter_kw,
      unit: "kW",
      is_existing: false,
      investment_idr:
        MOCK_HYBRID_SIZE.inverter_kw * economics.capex_inverter_idr_per_kw,
      energy_share_pct: null,
    },
    {
      key: "diesel",
      units: request.diesel.units,
      unit_capacity: request.diesel.unit_capacity_kw,
      unit: "kW",
      is_existing: true,
      investment_idr: null,
      energy_share_pct: MOCK_HYBRID_SHARE.diesel,
    },
  ];

  const cheapest = [...scenarios].sort((a, b) => a.npc_idr - b.npc_idr)[0];

  return {
    id: run.id,
    recommended_scenario: cheapest?.key ?? "baseline",
    solver: { ...SOLVER, model_status: "Optimal" },
    energy_balance_max_error_kwh: 0,
    components,
    scenarios,
    input: request,
  };
};

export const mockGetSimulationResult = async (id: string) => {
  await delay(350);
  const run = readRun(id);
  if (!run) {
    throw new ApiError("Simulasi tidak ditemukan atau sesi sudah berakhir.", {
      code: "NOT_FOUND",
      status: 404,
    });
  }
  const { status } = buildMockProgress(run, Date.now());
  if (status !== "completed") {
    throw new ApiError(
      status === "running" || status === "queued"
        ? "Solver belum selesai. Tunggu hingga semua skenario optimal."
        : "Simulasi ini tidak selesai, jadi belum ada hasil.",
      { code: "NOT_READY", status: 409 },
    );
  }
  if (!run.request) {
    throw new ApiError(
      "Data input run ini tidak tersimpan. Jalankan ulang optimasi.",
      { code: "NOT_FOUND", status: 404 },
    );
  }
  return { payload: buildMockResult(run, run.request) };
};
