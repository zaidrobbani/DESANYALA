import type {
  ScenarioResult,
  SimulationRequest,
} from "@/repository/simulation/dto";
import { formatNumber, formatPercent } from "@/shared/util/number";
import { type ConflictIssue, INPUT_SECTION } from "../data";

/*
 * Backend hanya mengembalikan status + pesan solver untuk skenario yang
 * gagal, tanpa menandai parameter penyebabnya. Daftar ini dugaan FE dari
 * input run (aturan sederhana), urut dari yang paling mungkin.
 */

const pct = (fraction: number) => formatPercent(fraction * 100, 0);

export const diagnoseFailure = (
  scenario: ScenarioResult,
  input: SimulationRequest,
): ConflictIssue[] => {
  const { generators, reliability, pv, battery, demand } = input;
  const issues: ConflictIssue[] = [];
  const forbidShortage = reliability.shortage_policy === "forbid";
  const connectedKw = demand.loads.reduce(
    (sum, load) => sum + (load.quantity * load.power_w) / 1000,
    0,
  );
  const gensetKw = generators.unit_count * generators.rated_power_each_kw;
  const usesPv = scenario.scenario_id !== "diesel_only" && pv.enabled;
  const usesBattery =
    scenario.scenario_id === "pv_diesel_battery" && battery.enabled;

  if (generators.mode === "existing" && gensetKw < connectedKw) {
    issues.push({
      field: "generators.rated_power_each_kw",
      section: INPUT_SECTION.generators,
      label: "Kapasitas genset eksisting",
      likelihood: forbidShortage ? "high" : "check",
      current_value: `${formatNumber(generators.unit_count)} × ${formatNumber(generators.rated_power_each_kw)} kW = ${formatNumber(gensetKw)} kW`,
      explanation: `Total daya terpasang peralatan ${formatNumber(connectedKw, 2)} kW lebih besar dari kapasitas genset tetap.`,
      suggestion:
        "Naikkan kapasitas per unit atau jumlah unit, atau pilih mode genset baru.",
    });
  }

  if (generators.min_loading_fraction >= 0.5) {
    issues.push({
      field: "generators.min_loading_fraction",
      section: INPUT_SECTION.generators,
      label: "Beban minimum genset",
      likelihood: "check",
      current_value: pct(generators.min_loading_fraction),
      explanation:
        "Beban minimum tinggi memaksa genset menyala di atas kebutuhan saat beban rendah (malam/dini hari).",
      suggestion: "Coba turunkan ke 25–30 %.",
    });
  }

  if (forbidShortage) {
    issues.push({
      field: "reliability.shortage_policy",
      section: INPUT_SECTION.reliability,
      label: "Kebijakan kekurangan energi",
      likelihood: "check",
      current_value: "Tidak diizinkan",
      explanation:
        "Model wajib memenuhi 100 % beban setiap jam; lonjakan beban sesaat bisa membuatnya infeasible.",
      suggestion:
        "Izinkan kekurangan dalam batas kecil (mis. 0,5 %) untuk menguji sensitivitas.",
    });
  }

  if (usesPv && pv.capacity_mode === "fixed") {
    issues.push({
      field: "pv.fixed_capacity_kwp",
      section: INPUT_SECTION.pv,
      label: "Kapasitas PV tetap",
      likelihood: "check",
      current_value: `${formatNumber(pv.fixed_capacity_kwp ?? 0)} kWp`,
      explanation:
        "Kapasitas tetap tidak bisa disesuaikan optimizer untuk menutup kebutuhan.",
      suggestion: "Gunakan mode dioptimalkan oleh sistem.",
    });
  }

  if (usesBattery && battery.soc_min_fraction >= 0.4) {
    issues.push({
      field: "battery.soc_min_fraction",
      section: INPUT_SECTION.battery,
      label: "SOC minimum baterai",
      likelihood: "check",
      current_value: pct(battery.soc_min_fraction),
      explanation:
        "SOC minimum tinggi mengurangi kapasitas baterai yang benar-benar bisa dipakai.",
      suggestion: "Coba 20 % untuk baterai lithium.",
    });
  }

  return issues;
};
