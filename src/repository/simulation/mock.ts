/*
 * Mock backend DesaNyala — dipakai saat API_MODE = "mock", atau sebagai
 * fallback saat backend error di API_MODE = "auto" (lihat lib/env.ts).
 *
 * Menghasilkan bentuk respons yang sama dengan backend
 * (POST /api/v1/optimizations & /api/v1/inputs/validate) dari input form.
 * Angkanya heuristik sederhana untuk demo UI, BUKAN hasil Offgridders.
 */
import { MOCK_SOLVER_RESULT } from "@/lib/env";
import { ApiError } from "@/lib/try-catch";
import { formatNumber } from "@/shared/util/number";
import type {
  Capacities,
  DispatchPoint,
  InputValidationResponse,
  OptimizationResponse,
  ScenarioKey,
  ScenarioMetrics,
  ScenarioResult,
  SimulationRequest,
} from "./dto";
import { SCENARIO_LABEL } from "./run-store";

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new ApiError("Permintaan dibatalkan.", { code: "CANCELLED" }));
    });
  });

/** Energi diesel per liter (kWh/L, LHV) dan faktor emisi (kgCO2/L). */
const DIESEL_KWH_PER_LITER = 9.8;
const CO2_KG_PER_LITER = 2.68;

/* ------------------------------------------------------------------------ */
/* Profil per jam                                                           */
/* ------------------------------------------------------------------------ */

/* Bobot beban desa per jam (puncak malam), dinormalisasi ke energi harian. */
const LOAD_SHAPE = [
  0.45, 0.4, 0.38, 0.38, 0.42, 0.55, 0.7, 0.75, 0.7, 0.68, 0.7, 0.75, 0.78,
  0.75, 0.72, 0.72, 0.8, 1.0, 1.35, 1.5, 1.4, 1.15, 0.8, 0.55,
];
const LOAD_SHAPE_SUM = LOAD_SHAPE.reduce((sum, w) => sum + w, 0);

const dailyEnergyKwh = (request: SimulationRequest) =>
  request.demand.loads.reduce(
    (sum, load) =>
      sum + (load.quantity * load.power_w * load.hours_per_day) / 1000,
    0,
  );

const connectedPowerKw = (request: SimulationRequest) =>
  request.demand.loads.reduce(
    (sum, load) => sum + (load.quantity * load.power_w) / 1000,
    0,
  );

/** Variasi harian kecil supaya grafik 365 hari tidak datar. */
const dayFactor = (day: number) =>
  1 + 0.06 * Math.sin((2 * Math.PI * day) / 365);
const cloudFactor = (day: number) =>
  0.78 + 0.22 * Math.abs((Math.sin(day * 12.9898) * 43758.5453) % 1);

const demandAt = (daily: number, day: number, hour: number) =>
  daily * (LOAD_SHAPE[hour] / LOAD_SHAPE_SUM) * dayFactor(day);

/** Produksi PV per kWp: kurva siang 06–18 dengan luas = PSH × PR. */
const pvPerKwpAt = (request: SimulationRequest, day: number, hour: number) => {
  if (hour < 6 || hour >= 18) return 0;
  const { peak_sun_hours_estimate: psh, system_performance_factor: pr } =
    request.pv;
  const shape = Math.sin((Math.PI * (hour - 6 + 0.5)) / 12);
  // Integral sin pada 12 jam = 24/π, jadi skala = PSH·PR·π/24.
  return shape * ((psh * pr * Math.PI) / 24) * cloudFactor(day);
};

const timestamp = (index: number) => {
  const date = new Date(Date.UTC(2018, 0, 1, index));
  return date.toISOString().replace("T", " ").slice(0, 19);
};

/* ------------------------------------------------------------------------ */
/* Sizing & dispatch heuristik                                              */
/* ------------------------------------------------------------------------ */

const crf = (rate: number, years: number) =>
  rate === 0
    ? 1 / years
    : (rate * (1 + rate) ** years) / ((1 + rate) ** years - 1);

const sizeScenario = (
  request: SimulationRequest,
  key: ScenarioKey,
  peakKw: number,
): Capacities => {
  const { pv, battery, generators } = request;
  const daily = dailyEnergyKwh(request);
  const yieldPerKwp = Math.max(
    0.1,
    pv.peak_sun_hours_estimate * pv.system_performance_factor,
  );
  const usesPv = key !== "diesel_only" && pv.enabled;
  const usesBattery = key === "pv_diesel_battery" && battery.enabled;

  const targetShare = usesBattery ? 0.6 : 0.3;
  const pvKwp = !usesPv
    ? 0
    : pv.capacity_mode === "fixed"
      ? (pv.fixed_capacity_kwp ?? 0)
      : Math.min(
          pv.capacity_max_kwp,
          Math.max(pv.capacity_min_kwp, (daily * targetShare) / yieldPerKwp),
        );
  const batteryKwh = usesBattery
    ? Math.min(
        battery.capacity_max_kwh,
        Math.max(battery.capacity_min_kwh, daily * 0.35),
      )
    : 0;
  const gensetKw =
    generators.mode === "existing"
      ? generators.unit_count * generators.rated_power_each_kw
      : Math.ceil(peakKw * 1.1);

  return {
    pv_kwp: pvKwp,
    genset_kw: gensetKw,
    battery_kwh: batteryKwh,
    battery_power_kw: usesBattery
      ? Math.min(battery.power_max_kw, batteryKwh / 2)
      : 0,
    genset_capacity_basis: "aggregate",
  };
};

const simulate = (
  request: SimulationRequest,
  key: ScenarioKey,
): ScenarioResult => {
  const { battery, generators, economics, pv, project } = request;
  const hours = project.simulation_days * 24;
  const daily = dailyEnergyKwh(request);
  const peakKw = Math.max(...LOAD_SHAPE) * (daily / LOAD_SHAPE_SUM) * 1.06;
  const capacities = sizeScenario(request, key, peakKw);
  const pvKwp = capacities.pv_kwp ?? 0;
  const batteryKwh = capacities.battery_kwh ?? 0;
  const batteryKw = capacities.battery_power_kw ?? 0;
  const gensetMaxKw =
    (capacities.genset_kw ?? 0) * generators.max_loading_fraction;
  const socMin = batteryKwh * battery.soc_min_fraction;
  const socMax = batteryKwh * battery.soc_max_fraction;
  let soc = batteryKwh * battery.soc_initial_fraction;

  const dispatch: DispatchPoint[] = [];
  const totals = {
    demand: 0,
    pv: 0,
    genset: 0,
    excess: 0,
    unmet: 0,
    peak: 0,
  };

  for (let index = 0; index < hours; index++) {
    const day = Math.floor(index / 24);
    const hour = index % 24;
    const demand = demandAt(daily, day, hour);
    const pvKw = pvKwp * pvPerKwpAt(request, day, hour);
    let deficit = demand - pvKw;
    let charge = 0;
    let discharge = 0;
    let excess = 0;

    if (deficit < 0) {
      const surplus = -deficit;
      charge = Math.min(
        surplus,
        batteryKw,
        (socMax - soc) / battery.charge_efficiency,
      );
      charge = Math.max(0, charge);
      soc += charge * battery.charge_efficiency;
      excess = surplus - charge;
      deficit = 0;
    } else {
      discharge = Math.max(
        0,
        Math.min(
          deficit,
          batteryKw,
          (soc - socMin) * battery.discharge_efficiency,
        ),
      );
      soc -= discharge / battery.discharge_efficiency;
      deficit -= discharge;
    }

    const genset = Math.min(deficit, gensetMaxKw);
    const unmet = deficit - genset;

    totals.demand += demand;
    totals.pv += pvKw - excess;
    totals.genset += genset;
    totals.excess += excess;
    totals.unmet += unmet;
    totals.peak = Math.max(totals.peak, demand);

    dispatch.push({
      timestamp: timestamp(index),
      demand_kw: demand,
      pv_kw: pvKw,
      generator_power_kw: genset,
      battery_charge_kw: charge,
      battery_discharge_kw: discharge,
      battery_soc_kwh: batteryKwh > 0 ? soc : 0,
      battery_soc_fraction: batteryKwh > 0 ? soc / batteryKwh : 0,
      excess_power_kw: excess,
      unmet_demand_kw: unmet,
    });
  }

  // Normalisasi ke basis tahunan bila periode < 365 hari.
  const annual = 365 / project.simulation_days;
  const fuelLiters =
    (totals.genset / (generators.efficiency_fraction * DIESEL_KWH_PER_LITER)) *
    annual;
  const rate = economics.discount_rate;
  const capex =
    pvKwp * pv.capex_per_kwp * crf(rate, pv.lifetime_years) +
    (batteryKwh * battery.capex_per_kwh +
      batteryKw * battery.power_capex_per_kw) *
      crf(rate, battery.lifetime_years) +
    (generators.mode === "new"
      ? (capacities.genset_kw ?? 0) *
        generators.capex_per_kw *
        crf(rate, generators.lifetime_years)
      : 0);
  const opex =
    pvKwp * pv.opex_annual_per_kwp +
    generators.unit_count * generators.opex_annual_per_unit +
    fuelLiters * generators.fuel_price_per_liter;
  const annualizedCost =
    capex +
    opex +
    economics.additional_project_cost *
      crf(rate, project.project_lifetime_years);
  const annualDemand = totals.demand * annual;
  const annualUnmet = totals.unmet * annual;

  const metrics: ScenarioMetrics = {
    lcoe:
      annualDemand > 0 ? annualizedCost / (annualDemand - annualUnmet) : null,
    annualized_cost: annualizedCost,
    npv: annualizedCost / crf(rate, project.project_lifetime_years),
    annual_demand_kwh: annualDemand,
    annual_supplied_kwh: annualDemand - annualUnmet,
    annual_unmet_energy_kwh: annualUnmet,
    supply_reliability_fraction:
      annualDemand > 0 ? (annualDemand - annualUnmet) / annualDemand : null,
    renewable_share_fraction:
      annualDemand > 0
        ? (totals.pv * annual) / (annualDemand - annualUnmet)
        : 0,
    annual_fuel_liters: fuelLiters,
    annual_co2_kg: fuelLiters * CO2_KG_PER_LITER,
    peak_demand_kw: totals.peak,
    annual_pv_generation_kwh: (totals.pv + totals.excess) * annual,
    annual_genset_generation_kwh: totals.genset * annual,
    annual_excess_energy_kwh: totals.excess * annual,
  };

  const reliabilityPassed =
    request.reliability.shortage_policy === "forbid"
      ? annualUnmet < 1e-6
      : annualUnmet / Math.max(annualDemand, 1) <=
        request.reliability.max_unmet_energy_fraction + 1e-9;

  return {
    scenario_id: key,
    scenario_name: SCENARIO_LABEL[key],
    status: reliabilityPassed ? "optimal" : "feasible",
    metrics,
    capacities,
    validation: {
      energy_balance_passed: true,
      reliability_passed: reliabilityPassed,
      capacity_constraints_passed: true,
      solver_message:
        "Mock FE: angka dihitung heuristik di browser, bukan hasil Offgridders.",
      warnings: [
        "Profil beban diulang dari satu hari representatif; belum memodelkan variasi hari kerja/akhir pekan atau variasi musiman.",
        ...(pv.enabled
          ? [
              "Profil PV adalah kurva sintetis dari peak sun hours dan performance factor, bukan data cuaca lokasi yang tervalidasi.",
            ]
          : []),
      ],
    },
    dispatch,
  };
};

const infeasible = (key: ScenarioKey, reason: string): ScenarioResult => ({
  scenario_id: key,
  scenario_name: SCENARIO_LABEL[key],
  status: "infeasible",
  metrics: {
    lcoe: null,
    annualized_cost: null,
    npv: null,
    annual_demand_kwh: null,
    annual_supplied_kwh: null,
    annual_unmet_energy_kwh: null,
    supply_reliability_fraction: null,
    renewable_share_fraction: null,
    annual_fuel_liters: null,
    annual_co2_kg: null,
    peak_demand_kw: null,
    annual_pv_generation_kwh: null,
    annual_genset_generation_kwh: null,
    annual_excess_energy_kwh: null,
  },
  capacities: {
    pv_kwp: null,
    genset_kw: null,
    battery_kwh: null,
    battery_power_kw: null,
    genset_capacity_basis: "unknown",
  },
  validation: {
    energy_balance_passed: null,
    reliability_passed: false,
    capacity_constraints_passed: null,
    solver_message: reason,
    warnings: [],
  },
  dispatch: [],
});

/** Skenario yang dibuat infeasible beserta alasannya. */
const resolveFailures = (
  request: SimulationRequest,
  keys: ScenarioKey[],
): Map<ScenarioKey, string> => {
  const failures = new Map<ScenarioKey, string>();
  if (MOCK_SOLVER_RESULT === "fail") {
    for (const key of keys) {
      failures.set(key, "Model infeasible (mode mock: fail).");
    }
    return failures;
  }
  if (MOCK_SOLVER_RESULT === "fail-partial" && keys.length > 0) {
    failures.set(
      keys[keys.length - 1],
      "Model infeasible (mode mock: fail-partial).",
    );
    return failures;
  }
  if (MOCK_SOLVER_RESULT === "success") return failures;

  const { generators, reliability } = request;
  const gensetKw = generators.unit_count * generators.rated_power_each_kw;
  const peak = connectedPowerKw(request);
  if (
    keys.includes("diesel_only") &&
    generators.mode === "existing" &&
    reliability.shortage_policy === "forbid" &&
    gensetKw < peak
  ) {
    failures.set(
      "diesel_only",
      `Daya terpasang peralatan ${formatNumber(peak, 2)} kW melebihi kapasitas genset ${formatNumber(gensetKw)} kW, sementara kekurangan listrik tidak diizinkan.`,
    );
  }
  return failures;
};

/* ------------------------------------------------------------------------ */
/* Endpoint mock                                                            */
/* ------------------------------------------------------------------------ */

export const mockValidateInput = async (
  request: SimulationRequest,
): Promise<InputValidationResponse> => {
  await delay(250);
  const daily = dailyEnergyKwh(request);
  const intervals = request.project.simulation_days * 24;
  return {
    valid: true,
    estimated_daily_energy_kwh: daily,
    estimated_annual_energy_kwh: daily * 365,
    connected_power_kw: connectedPowerKw(request),
    generated_demand_intervals: intervals,
    generated_pv_intervals: intervals,
    equipment_rows: request.demand.loads.length,
    warnings: [],
  };
};

export const mockRunOptimization = async (
  request: SimulationRequest,
  signal: AbortSignal,
): Promise<OptimizationResponse> => {
  const keys = request.optimization.scenarios.map(({ id }) => id);
  await delay(2500 + 2500 * keys.length, signal);

  if (MOCK_SOLVER_RESULT === "error") {
    throw new ApiError(
      "Offgridders exit code 1 (mode mock: error). Detail log ada di runs/<run_id>.",
      { code: "engine_error", status: 422 },
    );
  }

  const failures = resolveFailures(request, keys);
  const scenarioResults = keys.map((key) => {
    const reason = failures.get(key);
    return reason ? infeasible(key, reason) : simulate(request, key);
  });
  const usable = scenarioResults.filter(
    (s) => s.status === "optimal" || s.status === "feasible",
  );
  const status =
    usable.length === 0
      ? "infeasible"
      : usable.every((s) => s.status === "optimal") &&
          usable.length === scenarioResults.length
        ? "optimal"
        : "feasible";
  const currency = request.project.currency;

  return {
    schema_version: "1.0.0",
    project_id: `mock${Math.random().toString(16).slice(2, 14)}`,
    status,
    generated_at: new Date().toISOString(),
    period_days: request.project.simulation_days,
    time_step_hours: request.project.time_step_hours,
    units: {
      currency,
      lcoe: `${currency}/kWh`,
      energy: "kWh",
      power: "kW",
      pv_capacity: "kWp",
      battery_capacity: "kWh",
      fuel: "L/year",
      emissions: "kgCO2eq/year",
    },
    selected_scenario_id: keys[0] ?? null,
    scenario_results: scenarioResults,
    validation: {
      energy_balance_passed: usable.length > 0 ? true : null,
      reliability_passed:
        usable.length > 0
          ? usable.every((s) => s.validation.reliability_passed)
          : null,
      capacity_constraints_passed: usable.length > 0 ? true : null,
      solver_message: "Mock FE selesai.",
      warnings: [],
    },
    warnings: [],
  };
};
