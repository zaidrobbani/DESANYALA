import { IconGasStation } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";
import type { ResultSummary } from "../util/summarize-result";
import MetricValue from "./MetricValue";
import ScenarioBarChart from "./ScenarioBarChart";

/** Estimasi solar dibulatkan ke ratusan liter. */
const roundLiters = (liters: number) => Math.round(liters / 100) * 100;

interface SolarSectionProps {
  summary: ResultSummary;
  specificConsumption: number;
}

const SolarSection = ({ summary, specificConsumption }: SolarSectionProps) => {
  const { baseline, hybrid, fuelReductionPct } = summary;
  const hybridLiters = roundLiters(hybrid.fuel_liters_per_year);
  const baselineLiters = roundLiters(baseline.fuel_liters_per_year);
  const isLower = fuelReductionPct > 0;

  return (
    <SectionCard
      icon={IconGasStation}
      title="4. Konsumsi solar"
      description="Estimasi pemakaian bahan bakar per tahun."
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <p className="text-fg-secondary text-small">Hybrid</p>
          <MetricValue
            value={`≈ ${formatNumber(hybridLiters, 0)}`}
            unit="liter/tahun"
          />
        </div>
        <p
          className={cn(
            "pb-1.5 text-body-strong",
            isLower ? "text-success" : "text-warning",
          )}
        >
          {isLower ? "−" : "+"}
          {formatNumber(Math.abs(fuelReductionPct), 0)} % dari ≈{" "}
          {formatNumber(baselineLiters, 0)}
        </p>
      </div>
      <ScenarioBarChart
        ariaLabel="Perbandingan konsumsi solar per tahun"
        data={[
          { key: "baseline", value: baselineLiters },
          { key: "hybrid", value: hybridLiters },
        ]}
        formatValue={(value) => formatNumber(value, 0)}
        className="h-[170px]"
      />
      <p className="text-fg-tertiary text-small">
        Estimasi dari konsumsi spesifik {formatNumber(specificConsumption)}{" "}
        liter/kWh × energi dari genset.
      </p>
    </SectionCard>
  );
};

export default SolarSection;
