import type {
  DemandLoad,
  OptimizationScenario,
  ScenarioKey,
  SimulationDays,
  SimulationRequest,
} from "@/repository/simulation/dto";
import {
  batterySchema,
  type DemandLoadFormValues,
  pvSchema,
  type SimulationFormValues,
} from "@/schemas/simulation/simulation.schema";
import { parseIdNumber } from "@/shared/util/number";
import { SIMULATION_FORM_DEFAULTS } from "../data";

export const SCHEMA_VERSION = "desanyala.input.v1";

const NOTES = [
  "Input contract proposal for DesaNyala adapter. Not a native Offgridders workbook.",
  "Hourly demand and PV profiles still need to be generated or sourced before optimization.",
  "Multi-unit generator commitment requires an explicitly validated model.",
];

/** Sama dengan `num()` di HTML referensi: kosong/tidak valid = 0. */
const num = (raw: string) => {
  const value = parseIdNumber(raw);
  return Number.isFinite(value) ? value : 0;
};

/** Input persen di UI (0..100) -> pecahan 0..1 di JSON. */
const fraction = (raw: string) => num(raw) / 100;

/** Baris peralatan -> item `demand.loads[]` (sama dengan getLoads() di HTML). */
export const toDemandLoad = (load: DemandLoadFormValues): DemandLoad => {
  const quantity = Math.max(0, num(load.quantity));
  const powerW = Math.max(0, num(load.power_w));
  const hoursPerDay = Math.max(0, Math.min(24, num(load.hours_per_day)));
  return {
    category: load.category,
    device: load.device.trim(),
    quantity,
    power_w: powerW,
    hours_per_day: hoursPerDay,
    estimated_kwh_day: (quantity * powerW * hoursPerDay) / 1000,
  };
};

/** Sama dengan getScenarios() di HTML: urutan tetap, battery ikut toggle. */
export const toScenarios = (
  selected: readonly ScenarioKey[],
  batteryEnabled: boolean,
): OptimizationScenario[] => {
  const scenarios: OptimizationScenario[] = [];
  if (selected.includes("diesel_only")) {
    scenarios.push({ id: "diesel_only", pv: false, battery: false });
  }
  if (selected.includes("pv_diesel")) {
    scenarios.push({ id: "pv_diesel", pv: true, battery: false });
  }
  if (selected.includes("pv_diesel_battery")) {
    scenarios.push({
      id: "pv_diesel_battery",
      pv: true,
      battery: batteryEnabled,
    });
  }
  return scenarios;
};

/*
 * Field PV/baterai yang nonaktif disembunyikan dan tidak divalidasi form,
 * tetapi backend tetap memvalidasi seluruh objek `pv`/`battery`. Bila nilai
 * tersembunyi tidak valid, kirim nilai contoh awal (tetap enabled=false).
 */
const sanitizePv = (pv: SimulationFormValues["pv"]) =>
  pv.enabled || pvSchema.safeParse({ ...pv, enabled: true }).success
    ? pv
    : { ...SIMULATION_FORM_DEFAULTS.pv, enabled: false };

const sanitizeBattery = (battery: SimulationFormValues["battery"]) =>
  battery.enabled ||
  batterySchema.safeParse({ ...battery, enabled: true }).success
    ? battery
    : { ...SIMULATION_FORM_DEFAULTS.battery, enabled: false };

/** Ubah nilai form menjadi payload `desanyala.input.v1` (buildConfig()). */
export const toSimulationRequest = (
  values: SimulationFormValues,
): SimulationRequest => {
  const { project, demand, generators, economics, reliability, optimization } =
    values;
  const pv = sanitizePv(values.pv);
  const battery = sanitizeBattery(values.battery);
  const loads = demand.loads.map(toDemandLoad);
  const dailyEnergy = loads.reduce(
    (sum, load) => sum + load.estimated_kwh_day,
    0,
  );
  const location = project.location.trim();

  return {
    schema_version: SCHEMA_VERSION,
    project: {
      name: project.name.trim(),
      location,
      households: num(project.households),
      electrification_status: project.electrification_status,
      simulation_days: Number(project.simulation_days) as SimulationDays,
      time_step_hours: 1,
      project_lifetime_years: num(project.project_lifetime_years),
      currency: project.currency,
    },
    demand: {
      profile_source: "equipment_estimate",
      loads,
      estimated_daily_energy_kwh: dailyEnergy,
      estimated_annual_energy_kwh: dailyEnergy * 365,
      profile_generation_method: "not_implemented",
    },
    pv: {
      enabled: pv.enabled,
      resource_location: pv.resource_location.trim() || location,
      peak_sun_hours_estimate: num(pv.peak_sun_hours_estimate),
      system_performance_factor: fraction(pv.system_performance_factor),
      capacity_mode: pv.capacity_mode,
      fixed_capacity_kwp:
        pv.capacity_mode === "fixed" ? num(pv.fixed_capacity_kwp) : null,
      capacity_min_kwp: num(pv.capacity_min_kwp),
      capacity_max_kwp: num(pv.capacity_max_kwp),
      capex_per_kwp: num(pv.capex_per_kwp),
      opex_annual_per_kwp: num(pv.opex_annual_per_kwp),
      lifetime_years: num(pv.lifetime_years),
      hourly_profile_source: "not_configured",
    },
    generators: {
      mode: generators.mode,
      unit_count: num(generators.unit_count),
      identical_units_assumption: true,
      rated_power_each_kw: num(generators.rated_power_each_kw),
      min_loading_fraction: fraction(generators.min_loading_fraction),
      max_loading_fraction: fraction(generators.max_loading_fraction),
      fuel_price_per_liter: num(generators.fuel_price_per_liter),
      fuel_model: generators.fuel_model,
      efficiency_fraction: fraction(generators.efficiency_fraction),
      capex_per_kw: num(generators.capex_per_kw),
      opex_annual_per_unit: num(generators.opex_annual_per_unit),
      lifetime_years: num(generators.lifetime_years),
      unit_commitment_model: "requires_validation",
    },
    battery: {
      enabled: battery.enabled,
      capacity_min_kwh: num(battery.capacity_min_kwh),
      capacity_max_kwh: num(battery.capacity_max_kwh),
      power_max_kw: num(battery.power_max_kw),
      charge_efficiency: fraction(battery.charge_efficiency),
      discharge_efficiency: fraction(battery.discharge_efficiency),
      soc_min_fraction: fraction(battery.soc_min_fraction),
      soc_max_fraction: fraction(battery.soc_max_fraction),
      soc_initial_fraction: fraction(battery.soc_initial_fraction),
      capex_per_kwh: num(battery.capex_per_kwh),
      power_capex_per_kw: num(battery.power_capex_per_kw),
      lifetime_years: num(battery.lifetime_years),
    },
    economics: {
      discount_rate: fraction(economics.discount_rate),
      fuel_price_escalation_annual: fraction(
        economics.fuel_price_escalation_annual,
      ),
      additional_project_cost: num(economics.additional_project_cost),
    },
    reliability: {
      target_supply_fraction: fraction(reliability.target_supply_fraction),
      shortage_policy: reliability.shortage_policy,
      max_unmet_energy_fraction:
        reliability.shortage_policy === "bounded"
          ? fraction(reliability.max_unmet_energy_fraction)
          : 0,
      reserve_margin_fraction: fraction(reliability.reserve_margin_fraction),
    },
    optimization: {
      objective: optimization.objective,
      scenarios: toScenarios(optimization.scenarios, battery.enabled),
      solver_configuration: "backend_default",
    },
    notes: NOTES,
  };
};
