/*
 * Kontrak API simulasi DesaNyala.
 *
 * Backend (https://github.com/dindawijayanto/desa-nyala-backend, FastAPI):
 *
 *   GET  /health                   -> HealthResponse
 *   POST /api/v1/inputs/validate   -> InputValidationResponse
 *   POST /api/v1/optimizations     -> OptimizationResponse   (sinkron)
 *
 * Body kedua POST = SimulationRequest (`desanyala.input.v1`). Error mengikuti
 * FastAPI: `{ detail: string | { status, message } | ValidationErrorItem[] }`.
 *
 * Backend menjalankan semua skenario dalam satu request dan langsung
 * mengembalikan hasil, tanpa endpoint progres/batal/hasil per id. Progres,
 * pembatalan, dan penyimpanan hasil per run dikelola di FE
 * (lihat `run-store.ts`); tipenya ada di bagian "Run lokal" di bawah.
 */

/** Id skenario di `optimization.scenarios[].id`. */
export type ScenarioKey = "diesel_only" | "pv_diesel" | "pv_diesel_battery";

/* ------------------------------------------------------------------------ */
/* Request: desanyala.input.v1 (desanyala_variable_names.txt)               */
/* ------------------------------------------------------------------------ */

/*
 * Sama dengan buildConfig() di desanyala_input_cards.html. Format DesaNyala,
 * BUKAN workbook native Offgridders; backend/adapter yang menerjemahkannya.
 * Semua persentase dikirim sebagai pecahan 0..1. Properti turunan
 * (`estimated_*`, `profile_generation_method`, `hourly_profile_source`,
 * `notes`) diabaikan backend tetapi tetap dikirim sesuai referensi.
 */

export type ElectrificationStatus =
  | "unserved"
  | "diesel_existing"
  | "hybrid_existing";

export type Currency = "IDR" | "USD";

export type SimulationDays = 365 | 30 | 7;

export type LoadCategory =
  | "Rumah tangga"
  | "Sekolah"
  | "Puskesmas"
  | "Pompa air"
  | "UMKM"
  | "Fasilitas umum"
  | "Lainnya";

export type DemandLoad = {
  category: LoadCategory;
  device: string;
  /** unit */
  quantity: number;
  /** watt per unit */
  power_w: number;
  /** jam/hari, 0..24 */
  hours_per_day: number;
  /** quantity × power_w × hours_per_day / 1000 */
  estimated_kwh_day: number;
};

export type OptimizationScenario = {
  id: ScenarioKey;
  pv: boolean;
  battery: boolean;
};

export type SimulationRequest = {
  schema_version: "desanyala.input.v1";
  project: {
    name: string;
    location: string;
    households: number;
    electrification_status: ElectrificationStatus;
    simulation_days: SimulationDays;
    /** Konstan 1 (per jam), bukan field yang dapat diedit. */
    time_step_hours: 1;
    project_lifetime_years: number;
    currency: Currency;
  };
  demand: {
    profile_source: "equipment_estimate";
    loads: DemandLoad[];
    estimated_daily_energy_kwh: number;
    estimated_annual_energy_kwh: number;
    profile_generation_method: "not_implemented";
  };
  pv: {
    enabled: boolean;
    /** Fallback ke project.location bila kosong. */
    resource_location: string;
    peak_sun_hours_estimate: number;
    system_performance_factor: number;
    capacity_mode: "optimize" | "fixed";
    /** null bila capacity_mode = "optimize". */
    fixed_capacity_kwp: number | null;
    capacity_min_kwp: number;
    capacity_max_kwp: number;
    capex_per_kwp: number;
    opex_annual_per_kwp: number;
    lifetime_years: number;
    hourly_profile_source: "not_configured";
  };
  generators: {
    mode: "existing" | "new";
    unit_count: number;
    identical_units_assumption: true;
    rated_power_each_kw: number;
    min_loading_fraction: number;
    max_loading_fraction: number;
    fuel_price_per_liter: number;
    fuel_model: "default" | "efficiency" | "curve";
    efficiency_fraction: number;
    capex_per_kw: number;
    opex_annual_per_unit: number;
    lifetime_years: number;
    unit_commitment_model: "requires_validation";
  };
  battery: {
    enabled: boolean;
    capacity_min_kwh: number;
    capacity_max_kwh: number;
    power_max_kw: number;
    charge_efficiency: number;
    discharge_efficiency: number;
    soc_min_fraction: number;
    soc_max_fraction: number;
    soc_initial_fraction: number;
    capex_per_kwh: number;
    power_capex_per_kw: number;
    lifetime_years: number;
  };
  economics: {
    discount_rate: number;
    fuel_price_escalation_annual: number;
    additional_project_cost: number;
  };
  reliability: {
    target_supply_fraction: number;
    shortage_policy: "forbid" | "bounded";
    /** 0 bila shortage_policy = "forbid". */
    max_unmet_energy_fraction: number;
    reserve_margin_fraction: number;
  };
  optimization: {
    objective: "annualized_cost" | "fuel_consumption";
    scenarios: OptimizationScenario[];
    solver_configuration: "backend_default";
  };
  notes: string[];
};

/* ------------------------------------------------------------------------ */
/* Response: desanyala_output_variable_names.txt (= app/schemas/results.py) */
/* ------------------------------------------------------------------------ */

export type RunStatus =
  | "queued"
  | "running"
  | "optimal"
  | "feasible"
  | "infeasible"
  | "error"
  | "not_implemented";

export type ValidationReport = {
  energy_balance_passed: boolean | null;
  reliability_passed: boolean | null;
  capacity_constraints_passed: boolean | null;
  solver_message: string | null;
  warnings: string[];
};

/** Semua metrik bisa null bila engine tidak menghasilkannya. */
export type ScenarioMetrics = {
  /** {currency}/kWh */
  lcoe: number | null;
  /** {currency}/tahun (annuity Offgridders) */
  annualized_cost: number | null;
  /** {currency} selama umur proyek */
  npv: number | null;
  annual_demand_kwh: number | null;
  annual_supplied_kwh: number | null;
  annual_unmet_energy_kwh: number | null;
  /** 0..1 */
  supply_reliability_fraction: number | null;
  /** 0..1 */
  renewable_share_fraction: number | null;
  annual_fuel_liters: number | null;
  annual_co2_kg: number | null;
  peak_demand_kw: number | null;
  annual_pv_generation_kwh: number | null;
  annual_genset_generation_kwh: number | null;
  annual_excess_energy_kwh: number | null;
};

export type Capacities = {
  pv_kwp: number | null;
  genset_kw: number | null;
  battery_kwh: number | null;
  battery_power_kw: number | null;
  /** Apakah genset_kw total semua unit atau per unit. */
  genset_capacity_basis: "aggregate" | "per_unit" | "unknown";
};

/** Satu interval dispatch (daya rata-rata kW selama `time_step_hours`). */
export type DispatchPoint = {
  /** "2018-01-01 00:00:00" (tahun referensi engine, bukan tanggal nyata). */
  timestamp: string;
  demand_kw: number;
  pv_kw: number;
  generator_power_kw: number;
  battery_charge_kw: number;
  battery_discharge_kw: number;
  battery_soc_kwh: number | null;
  /** 0..1 */
  battery_soc_fraction: number | null;
  excess_power_kw: number;
  unmet_demand_kw: number;
};

export type ScenarioResult = {
  /** Sama dengan ScenarioKey yang diminta. */
  scenario_id: ScenarioKey;
  scenario_name: string;
  status: RunStatus;
  metrics: ScenarioMetrics;
  capacities: Capacities;
  validation: ValidationReport;
  dispatch: DispatchPoint[];
};

export type OptimizationUnits = {
  currency: Currency;
  /** mis. "IDR/kWh" */
  lcoe: string;
  energy: string;
  power: string;
  pv_capacity: string;
  battery_capacity: string;
  fuel: string;
  emissions: string;
};

export type OptimizationResponse = {
  schema_version: string;
  /** Id run di backend (folder runs/<id>). */
  project_id: string;
  status: RunStatus;
  /** ISO-8601 */
  generated_at: string;
  period_days: number;
  time_step_hours: number;
  units: OptimizationUnits;
  selected_scenario_id: ScenarioKey | null;
  scenario_results: ScenarioResult[];
  validation: ValidationReport;
  warnings: string[];
};

export type InputValidationResponse = {
  valid: boolean;
  estimated_daily_energy_kwh: number;
  estimated_annual_energy_kwh: number;
  connected_power_kw: number;
  generated_demand_intervals: number;
  generated_pv_intervals: number;
  equipment_rows: number;
  warnings: string[];
};

export type HealthResponse = {
  status: string;
  service: string;
  optimization_engine: "ready" | "not_imported";
  engine_path: string;
};

/** Item `detail` pada 422 validasi Pydantic. */
export type ValidationErrorItem = {
  /** mis. ["body", "pv", "capacity_max_kwp"] */
  loc: (string | number)[];
  msg: string;
  type: string;
};

/* ------------------------------------------------------------------------ */
/* Run lokal (dikelola run-store.ts, bukan endpoint backend)                 */
/* ------------------------------------------------------------------------ */

export type SimulationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ScenarioRunStatus =
  | "pending"
  | "running"
  | "optimal"
  | "feasible"
  | "infeasible"
  | "error"
  | "skipped"
  | "cancelled";

export type ScenarioProgress = {
  key: ScenarioKey;
  code: string;
  label: string;
  status: ScenarioRunStatus;
  /** 0..1 */
  progress: number;
  duration_seconds: number | null;
};

export type SolverLogLine = {
  level: "command" | "info" | "success" | "warning" | "error";
  text: string;
};

export type SimulationProgress = {
  id: string;
  status: SimulationStatus;
  current_scenario_index: number;
  total_scenarios: number;
  elapsed_seconds: number;
  solver: {
    name: string;
    method: string;
    periods: number;
  };
  scenarios: ScenarioProgress[];
  logs: SolverLogLine[];
  error: { code: string; message: string } | null;
};

export type SimulationCreateResponse = {
  payload: { id: string; status: SimulationStatus };
};

export type SimulationProgressResponse = {
  payload: SimulationProgress;
};

/** Hasil run yang tersimpan: respons backend + input yang dikirim. */
export type SimulationResult = {
  id: string;
  input: SimulationRequest;
  response: OptimizationResponse;
};

export type SimulationResultResponse = {
  payload: SimulationResult;
};

export type SimulationInputResponse = {
  payload: SimulationRequest;
};
