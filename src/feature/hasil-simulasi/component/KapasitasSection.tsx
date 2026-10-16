import { IconLayoutGrid } from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber, formatPercent } from "@/shared/util/number";
import { CAPACITY_META, CAPACITY_ORDER, GENSET_BASIS_LABEL } from "../data";
import MetricValue from "./MetricValue";

interface KapasitasSectionProps {
  scenario: ScenarioResult;
}

/** Kapasitas terpilih + porsi energi terbarukan (#capacityGrid, #renewableBar). */
const KapasitasSection = ({ scenario }: KapasitasSectionProps) => {
  const { capacities, metrics } = scenario;
  const renewable = metrics.renewable_share_fraction;
  const renewablePct = renewable === null ? null : renewable * 100;

  return (
    <SectionCard
      icon={IconLayoutGrid}
      title="Kapasitas terpilih"
      description="Ukuran komponen dari solusi optimizer."
    >
      <ul className="grid grid-cols-2 gap-3">
        {CAPACITY_ORDER.map((key) => {
          const meta = CAPACITY_META[key];
          const value = capacities[key];
          return (
            <li
              key={key}
              className="flex min-w-0 flex-col gap-1.5 rounded-lg bg-subtle p-4"
            >
              <span className="flex items-center gap-2">
                <meta.icon
                  aria-hidden
                  className={cn("size-5 shrink-0", meta.iconClass)}
                  stroke={1.75}
                />
                <span className="truncate text-body-strong">{meta.label}</span>
              </span>
              <MetricValue
                value={value === null ? "—" : formatNumber(value, 2)}
                unit={meta.unit}
                className="gap-1"
              />
              {key === "genset_kw" && (
                <span className="text-fg-tertiary text-small">
                  {GENSET_BASIS_LABEL[capacities.genset_capacity_basis]}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3">
        <p className="text-body-strong">Porsi energi terbarukan</p>
        <div className="flex items-center gap-3">
          <Progress
            value={Math.min(100, renewablePct ?? 0)}
            aria-label="Porsi energi terbarukan"
            className="h-2 flex-1 rounded-full bg-track [&>[data-slot=progress-indicator]]:bg-energy-pv"
          />
          <span className="w-16 text-right text-num-sm">
            {renewablePct === null ? "—" : formatPercent(renewablePct, 1)}
          </span>
        </div>
        <dl className="flex flex-col">
          <div className="flex justify-between gap-3 border-line border-b py-2">
            <dt className="text-fg-secondary text-small">Total kebutuhan</dt>
            <dd className="text-num-sm">
              {metrics.annual_demand_kwh === null
                ? "—"
                : `${formatNumber(metrics.annual_demand_kwh, 0)} kWh`}
            </dd>
          </div>
          <div className="flex justify-between gap-3 py-2">
            <dt className="text-fg-secondary text-small">Beban puncak</dt>
            <dd className="text-num-sm">
              {metrics.peak_demand_kw === null
                ? "—"
                : `${formatNumber(metrics.peak_demand_kw, 2)} kW`}
            </dd>
          </div>
        </dl>
      </div>
    </SectionCard>
  );
};

export default KapasitasSection;
