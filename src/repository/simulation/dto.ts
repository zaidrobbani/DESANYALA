/*
 * Kontrak API simulasi (usulan FE, belum final dengan backend).
 *
 *   POST /simulations               -> SimulationCreateResponse
 *        (body: SimulationRequest = desanyala.input.v1)
 *   GET  /simulations/:id/progress  -> SimulationProgressResponse
 *   POST /simulations/:id/cancel    -> 204
 */

/** Id skenario di `optimization.scenarios[].id`. */
export type ScenarioKey = "diesel_only" | "pv_diesel" | "pv_diesel_battery";

/*
 * Request body POST /simulations: kontrak input DesaNyala `desanyala.input.v1`,
 * sama dengan buildConfig() di desanyala_input_cards.html.
 * Ini format DesaNyala, BUKAN workbook native Offgridders; backend/adapter
 * yang menerjemahkannya. Semua persentase dikirim sebagai pecahan 0..1.
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
  level: "command" | "info" | "success" | "error";
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
    version: string;
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
