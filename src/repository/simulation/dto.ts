/*
 * Kontrak API simulasi (usulan FE, belum final dengan backend).
 *
 *   GET  /load-profiles/presets     -> LoadProfilePresetListResponse
 *   POST /simulations               -> SimulationCreateResponse
 *        (multipart bila ada file profil beban: field `payload` + `load_profile`)
 *   GET  /simulations/:id/progress  -> SimulationProgressResponse
 *   POST /simulations/:id/cancel    -> 204
 */

export type ScenarioKey = "baseline" | "hybrid";

export type DataSourceTone = "paper" | "user" | "assumption" | "success";

export type LoadProfileValidation = {
  rows: number;
  interval_minutes: number;
  unit: "kW";
  unit_consistent: boolean;
  negative_count: number;
  interpolated_count: number;
};

export type LoadProfilePreset = {
  id: string;
  name: string;
  description: string;
  /** Asal profil (badge di kartu pilihan). */
  source: { label: string; tone: DataSourceTone };
  /** Asal angka ringkasan energi/puncak/radiasi (badge di bawah statistik). */
  stats_source: { label: string; tone: DataSourceTone };
  daily_energy_kwh: number;
  peak_load_kw: number;
  avg_irradiance_kwh_m2_day: number;
  /** Profil beban harian tipikal 24 jam (kW), index 0 = 00:00. */
  hourly_profile_kw: number[];
  validation: LoadProfileValidation;
};

export type LoadProfilePresetListResponse = {
  payload: LoadProfilePreset[];
};

export type SimulationRequest = {
  location: {
    village_name: string;
    province: string;
    timezone: "WIB" | "WITA" | "WIT";
    latitude: number | null;
    longitude: number | null;
  };
  load:
    | { source: "preset"; preset_id: string }
    | {
        source: "manual";
        daily_energy_kwh: number;
        peak_load_kw: number;
        profile_file_name: string | null;
      };
  diesel: {
    units: number;
    unit_capacity_kw: number;
    min_load_pct: number;
    specific_consumption_l_per_kwh: number;
  };
  pv: {
    max_capacity_kwp: number;
    avg_irradiance_kwh_m2_day: number;
    lifetime_years: number;
  };
  battery: {
    max_capacity_kwh: number;
    min_soc_pct: number;
    round_trip_efficiency_pct: number;
  };
  economics: {
    capex_pv_idr_per_kwp: number;
    capex_battery_idr_per_kwh: number;
    capex_inverter_idr_per_kw: number;
    diesel_price_idr_per_liter: number;
    project_lifetime_years: number;
    discount_rate_pct: number;
    usd_idr_rate: number;
  };
  scenarios: ScenarioKey[];
  max_unserved_energy_pct: number;
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
