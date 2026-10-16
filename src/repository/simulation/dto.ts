/*
 * Kontrak API simulasi (usulan FE, belum final dengan backend).
 *
 *   GET  /load-profiles/presets     -> LoadProfilePresetListResponse
 *   POST /simulations               -> SimulationCreateResponse
 *        (multipart bila ada file profil beban: field `payload` + `load_profile`)
 *   GET  /simulations/:id/progress  -> SimulationProgressResponse
 *   POST /simulations/:id/cancel    -> 204
 *   GET  /simulations/:id/result    -> SimulationResultResponse
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

/* ------------------------------------------------------------------------ */
/* Hasil simulasi (409 NOT_READY bila solver belum selesai)                 */
/* ------------------------------------------------------------------------ */

export type HourlyDispatch = {
  /** 0..23, jam ke- pada hari tipikal. */
  hour: number;
  load_kw: number;
  diesel_kw: number;
  pv_kw: number;
  battery_discharge_kw: number;
  /** Daya yang masuk ke baterai (positif). */
  battery_charge_kw: number;
};

export type ScenarioResult = {
  key: ScenarioKey;
  label: string;
  solve_seconds: number;
  /** Net present cost selama umur proyek (Rp). */
  npc_idr: number;
  lcoe_idr_per_kwh: number;
  /** Investasi baru di skenario ini (Rp). Diesel eksisting tidak dihitung. */
  capex_idr: number;
  opex_idr_per_year: number;
  fuel_liters_per_year: number;
  served_energy_kwh_per_year: number;
  unserved_energy_pct: number;
  /** Rata-rata daya per jam pada hari tipikal, 24 baris. */
  typical_day_dispatch: HourlyDispatch[];
};

export type ComponentKey = "pv" | "battery" | "inverter" | "diesel";

export type ComponentResult = {
  key: ComponentKey;
  /** Jumlah unit (genset bisa > 1, selain itu 1). */
  units: number;
  /** Kapasitas per unit. */
  unit_capacity: number;
  unit: "kWp" | "kWh" | "kW";
  is_existing: boolean;
  /** Estimasi biaya investasi (Rp), null untuk komponen eksisting. */
  investment_idr: number | null;
  /** Porsi kebutuhan energi tahunan yang dipasok (%), null bila tidak relevan. */
  energy_share_pct: number | null;
};

export type SimulationResult = {
  id: string;
  /** Skenario dengan NPC terendah. */
  recommended_scenario: ScenarioKey;
  solver: SimulationProgress["solver"] & { model_status: string };
  /** Selisih maksimum neraca energi di seluruh periode (kWh). */
  energy_balance_max_error_kwh: number;
  /** Konfigurasi optimal skenario hybrid. */
  components: ComponentResult[];
  scenarios: ScenarioResult[];
  /** Input yang dipakai saat run (dikembalikan apa adanya). */
  input: SimulationRequest;
};

export type SimulationResultResponse = {
  payload: SimulationResult;
};
