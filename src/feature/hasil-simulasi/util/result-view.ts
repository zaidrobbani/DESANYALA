import type {
  DispatchPoint,
  OptimizationResponse,
  ScenarioKey,
  ScenarioResult,
} from "@/repository/simulation/dto";
import { isUsableScenario } from "@/repository/simulation/run-store";
import { DETAIL_INTERVALS, SCENARIO_ORDER } from "../data";

export { isUsableScenario };

/** Skenario urut tetap (Diesel-only, PV + Diesel, PV + Diesel + Baterai). */
export const orderedScenarios = (response: OptimizationResponse) =>
  SCENARIO_ORDER.flatMap(
    (key) => response.scenario_results.find((s) => s.scenario_id === key) ?? [],
  );

/** Skenario yang bisa dipakai dengan LCOE terendah, atau null. */
export const lowestLcoeScenario = (
  response: OptimizationResponse,
): ScenarioResult | null => {
  const candidates = orderedScenarios(response).filter(
    (s) => isUsableScenario(s) && s.metrics.lcoe !== null,
  );
  return candidates.reduce<ScenarioResult | null>(
    (best, s) =>
      !best || (s.metrics.lcoe ?? 0) < (best.metrics.lcoe ?? 0) ? s : best,
    null,
  );
};

/** Skenario default di tab: LCOE terendah, lalu skenario pertama. */
export const defaultScenarioKey = (
  response: OptimizationResponse,
): ScenarioKey | null =>
  lowestLcoeScenario(response)?.scenario_id ??
  response.selected_scenario_id ??
  orderedScenarios(response)[0]?.scenario_id ??
  null;

/* ------------------------------------------------------------------------ */
/* Dispatch untuk grafik & ekspor                                           */
/* ------------------------------------------------------------------------ */

/** Baris grafik. Satuan kW (detail) atau kWh/hari (ringkasan harian). */
export type EnergyRow = {
  /** Label sumbu X: "01-01" (harian) atau "01-01 13:00" (detail). */
  label: string;
  demand: number;
  pv: number;
  genset: number;
  discharge: number;
  /** Negatif: daya masuk ke baterai digambar di bawah nol. */
  charge: number;
  excess: number;
  unmet: number;
  /** SOC rata-rata (%), null bila baterai tidak ada. */
  soc: number | null;
};

export type DailyRow = {
  date: string;
  demand_kwh: number;
  pv_generation_kwh: number;
  genset_generation_kwh: number;
  excess_kwh: number;
  battery_charge_kwh: number;
  battery_discharge_kwh: number;
  /** 0..1, null bila tidak ada data SOC. */
  battery_soc_average_fraction: number | null;
  unmet_energy_kwh: number;
};

/** "2018-01-01 13:00:00" -> { date: "2018-01-01", time: "13:00" }. */
const splitTimestamp = (timestamp: string) => {
  const [date = timestamp, time = ""] = timestamp.split(/[ T]/);
  return { date, time: time.slice(0, 5) };
};

/** Total energi per hari dari dispatch per interval. */
export const aggregateDaily = (
  dispatch: DispatchPoint[],
  stepHours: number,
): DailyRow[] => {
  const days = new Map<
    string,
    DailyRow & { socSum: number; socCount: number }
  >();
  for (const point of dispatch) {
    const { date } = splitTimestamp(point.timestamp);
    let day = days.get(date);
    if (!day) {
      day = {
        date,
        demand_kwh: 0,
        pv_generation_kwh: 0,
        genset_generation_kwh: 0,
        excess_kwh: 0,
        battery_charge_kwh: 0,
        battery_discharge_kwh: 0,
        battery_soc_average_fraction: null,
        unmet_energy_kwh: 0,
        socSum: 0,
        socCount: 0,
      };
      days.set(date, day);
    }
    day.demand_kwh += point.demand_kw * stepHours;
    day.pv_generation_kwh += point.pv_kw * stepHours;
    day.genset_generation_kwh += point.generator_power_kw * stepHours;
    day.excess_kwh += point.excess_power_kw * stepHours;
    day.battery_charge_kwh += Math.abs(point.battery_charge_kw) * stepHours;
    day.battery_discharge_kwh +=
      Math.abs(point.battery_discharge_kw) * stepHours;
    day.unmet_energy_kwh += point.unmet_demand_kw * stepHours;
    if (point.battery_soc_fraction !== null) {
      day.socSum += point.battery_soc_fraction;
      day.socCount += 1;
    }
  }
  return [...days.values()].map(({ socSum, socCount, ...day }) => ({
    ...day,
    battery_soc_average_fraction: socCount > 0 ? socSum / socCount : null,
  }));
};

export const dailyChartRows = (daily: DailyRow[]): EnergyRow[] =>
  daily.map((day) => ({
    label: day.date.slice(5),
    demand: day.demand_kwh,
    pv: day.pv_generation_kwh,
    genset: day.genset_generation_kwh,
    discharge: day.battery_discharge_kwh,
    charge: -day.battery_charge_kwh,
    excess: day.excess_kwh,
    unmet: day.unmet_energy_kwh,
    soc:
      day.battery_soc_average_fraction === null
        ? null
        : day.battery_soc_average_fraction * 100,
  }));

/** Interval pertama (default 96 = 4 hari) dalam kW. */
export const detailChartRows = (
  dispatch: DispatchPoint[],
  limit = DETAIL_INTERVALS,
): EnergyRow[] =>
  dispatch.slice(0, limit).map((point) => {
    const { date, time } = splitTimestamp(point.timestamp);
    return {
      label: `${date.slice(5)} ${time}`,
      demand: point.demand_kw,
      pv: point.pv_kw,
      genset: point.generator_power_kw,
      // Konvensi sumber Offgridders bisa negatif; dinormalisasi positif.
      discharge: Math.abs(point.battery_discharge_kw),
      charge: -Math.abs(point.battery_charge_kw),
      excess: point.excess_power_kw,
      unmet: point.unmet_demand_kw,
      soc:
        point.battery_soc_fraction === null
          ? null
          : point.battery_soc_fraction * 100,
    };
  });

/** Skenario ini punya baterai (kapasitas > 0). */
export const hasBattery = (scenario: ScenarioResult) =>
  (scenario.capacities.battery_kwh ?? 0) > 0;
