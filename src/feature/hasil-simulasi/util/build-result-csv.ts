import type {
  ScenarioResult,
  SimulationResult,
} from "@/repository/simulation/dto";
import { DETAIL_INTERVALS, SCENARIO_META } from "../data";
import { aggregateDaily, orderedScenarios } from "./result-view";

/*
 * Ekspor mengikuti tombol di desanyala_output_dashboard.html:
 * downloadJson, downloadDispatch (96 interval), downloadDaily (agregat harian).
 * Angka ditulis dengan titik desimal tanpa pemisah ribuan agar mudah diolah.
 */

const cell = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(Math.round(value * 1e5) / 1e5) : "";
  }
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (header: string[], rows: (string | number | null)[][]) =>
  [header, ...rows].map((row) => row.map(cell).join(",")).join("\n");

/** 96 interval pertama (4 hari) skenario terpilih. */
export const buildDispatchCsv = (scenario: ScenarioResult) =>
  toCsv(
    [
      "timestamp",
      "demand_kw",
      "pv_kw",
      "genset_kw",
      "battery_charge_kw",
      "battery_discharge_kw",
      "battery_soc_percent",
      "excess_kw",
      "unmet_demand_kw",
    ],
    scenario.dispatch
      .slice(0, DETAIL_INTERVALS)
      .map((point) => [
        point.timestamp,
        point.demand_kw,
        point.pv_kw,
        point.generator_power_kw,
        Math.abs(point.battery_charge_kw),
        Math.abs(point.battery_discharge_kw),
        point.battery_soc_fraction === null
          ? null
          : point.battery_soc_fraction * 100,
        point.excess_power_kw,
        point.unmet_demand_kw,
      ]),
  );

/** Ringkasan harian (365 baris untuk simulasi setahun). */
export const buildDailyCsv = (scenario: ScenarioResult, stepHours: number) =>
  toCsv(
    [
      "date",
      "demand_kwh",
      "pv_generation_kwh",
      "genset_generation_kwh",
      "excess_kwh",
      "battery_charge_kwh",
      "battery_discharge_kwh",
      "battery_soc_average_fraction",
      "unmet_energy_kwh",
    ],
    aggregateDaily(scenario.dispatch, stepHours).map((day) => [
      day.date,
      day.demand_kwh,
      day.pv_generation_kwh,
      day.genset_generation_kwh,
      day.excess_kwh,
      day.battery_charge_kwh,
      day.battery_discharge_kwh,
      day.battery_soc_average_fraction,
      day.unmet_energy_kwh,
    ]),
  );

/** Ringkasan semua skenario (satu baris per skenario). */
export const buildSummaryCsv = (result: SimulationResult) => {
  const { units } = result.response;
  return toCsv(
    [
      "scenario_id",
      "scenario_name",
      "status",
      `lcoe_${units.lcoe.replace("/", "_per_")}`,
      `annualized_cost_${units.currency}`,
      `npv_${units.currency}`,
      "pv_kwp",
      "battery_kwh",
      "battery_power_kw",
      "genset_kw",
      "annual_demand_kwh",
      "annual_unmet_energy_kwh",
      "supply_reliability_fraction",
      "renewable_share_fraction",
      "annual_fuel_liters",
      "annual_co2_kg",
      "energy_balance_passed",
      "reliability_passed",
      "capacity_constraints_passed",
    ],
    orderedScenarios(result.response).map((s) => [
      s.scenario_id,
      SCENARIO_META[s.scenario_id]?.label ?? s.scenario_name,
      s.status,
      s.metrics.lcoe,
      s.metrics.annualized_cost,
      s.metrics.npv,
      s.capacities.pv_kwp,
      s.capacities.battery_kwh,
      s.capacities.battery_power_kw,
      s.capacities.genset_kw,
      s.metrics.annual_demand_kwh,
      s.metrics.annual_unmet_energy_kwh,
      s.metrics.supply_reliability_fraction,
      s.metrics.renewable_share_fraction,
      s.metrics.annual_fuel_liters,
      s.metrics.annual_co2_kg,
      s.validation.energy_balance_passed === null
        ? null
        : String(s.validation.energy_balance_passed),
      s.validation.reliability_passed === null
        ? null
        : String(s.validation.reliability_passed),
      s.validation.capacity_constraints_passed === null
        ? null
        : String(s.validation.capacity_constraints_passed),
    ]),
  );
};

/** Respons backend tanpa dispatch per jam + input yang dikirim. */
export const buildSummaryJson = (result: SimulationResult) =>
  JSON.stringify(
    {
      ...result.response,
      scenario_results: result.response.scenario_results.map(
        ({ dispatch, ...scenario }) => ({
          ...scenario,
          dispatch_intervals: dispatch.length,
        }),
      ),
      input: result.input,
    },
    null,
    2,
  );

export const downloadTextFile = (
  content: string,
  filename: string,
  type = "text/csv;charset=utf-8",
) => {
  // BOM agar Excel membaca UTF-8 dengan benar.
  const prefix = type.startsWith("text/csv") ? "﻿" : "";
  const blob = new Blob([prefix, content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
