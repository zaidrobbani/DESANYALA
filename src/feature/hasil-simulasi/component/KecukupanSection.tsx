import { IconShieldCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber, formatPercent } from "@/shared/util/number";

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut porsi beban terlayani (brand) vs tak terlayani. */
const SupplyDonut = ({ servedPct }: { servedPct: number }) => {
  const served = Math.min(100, Math.max(0, servedPct));
  return (
    <div className="relative size-[132px] shrink-0">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full -rotate-90"
        role="img"
        aria-label={`${formatNumber(served, 1)} % beban terlayani`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={served < 100 ? "var(--energy-unserved)" : "var(--bg-muted)"}
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={STROKE}
          strokeDasharray={`${(served / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        />
      </svg>
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center text-kpi"
      >
        {formatNumber(served, 1)} %
      </span>
    </div>
  );
};

interface KecukupanSectionProps {
  scenario: ScenarioResult;
  maxUnservedPct: number;
}

const KecukupanSection = ({
  scenario,
  maxUnservedPct,
}: KecukupanSectionProps) => {
  const unserved = scenario.unserved_energy_pct;
  const withinLimit = unserved <= maxUnservedPct;

  return (
    <SectionCard
      icon={IconShieldCheck}
      title="5. Kecukupan pasokan"
      description="Persentase kebutuhan energi yang terpenuhi."
    >
      <div className="flex items-center gap-6">
        <SupplyDonut servedPct={100 - unserved} />
        <dl className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-fg-secondary text-small">Beban terlayani</dt>
            <dd className="text-value">
              {formatNumber(scenario.served_energy_kwh_per_year, 0)} kWh/tahun
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-fg-secondary text-small">
              Beban tak terlayani
            </dt>
            <dd className="text-value">{formatPercent(unserved)}</dd>
            <dd
              className={cn(
                "text-small",
                withinLimit ? "text-success" : "text-danger",
              )}
            >
              {withinLimit ? "Sesuai" : "Melebihi"} batas{" "}
              {formatNumber(maxUnservedPct)} % di input
            </dd>
          </div>
        </dl>
      </div>
    </SectionCard>
  );
};

export default KecukupanSection;
