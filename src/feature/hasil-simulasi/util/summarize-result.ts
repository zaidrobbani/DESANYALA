import type {
  ComponentResult,
  ScenarioResult,
  SimulationResult,
} from "@/repository/simulation/dto";

/** Persentase penurunan `next` terhadap `base` (positif = lebih rendah). */
export const reductionPct = (base: number, next: number) =>
  base > 0 ? ((base - next) / base) * 100 : 0;

export type ResultSummary = {
  baseline: ScenarioResult;
  hybrid: ScenarioResult;
  recommended: ScenarioResult;
  components: ComponentResult[];
  lifetimeYears: number;
  lcoeReductionPct: number;
  npcReductionPct: number;
  fuelReductionPct: number;
};

/**
 * Pasangkan skenario baseline & hybrid. Halaman Hasil membandingkan
 * keduanya, jadi null bila salah satu tidak dijalankan.
 */
export const summarizeResult = (
  result: SimulationResult,
): ResultSummary | null => {
  const baseline = result.scenarios.find((s) => s.key === "baseline");
  const hybrid = result.scenarios.find((s) => s.key === "hybrid");
  if (!baseline || !hybrid) return null;

  return {
    baseline,
    hybrid,
    recommended: result.recommended_scenario === "baseline" ? baseline : hybrid,
    components: result.components,
    lifetimeYears: result.input.economics.project_lifetime_years,
    lcoeReductionPct: reductionPct(
      baseline.lcoe_idr_per_kwh,
      hybrid.lcoe_idr_per_kwh,
    ),
    npcReductionPct: reductionPct(baseline.npc_idr, hybrid.npc_idr),
    fuelReductionPct: reductionPct(
      baseline.fuel_liters_per_year,
      hybrid.fuel_liters_per_year,
    ),
  };
};

/** "2 × 80" untuk genset, "70,1" untuk lainnya (tanpa satuan). */
export const formatCapacity = (
  component: ComponentResult,
  format: (value: number) => string,
) =>
  component.units > 1
    ? `${component.units} × ${format(component.unit_capacity)}`
    : format(component.unit_capacity);
