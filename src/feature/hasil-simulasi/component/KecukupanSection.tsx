import { IconShieldCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ScenarioMetrics } from "@/repository/simulation/dto";
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
  metrics: ScenarioMetrics;
  /** Target pemenuhan dari input (pecahan 0..1). */
  targetFraction: number;
}

/** Kecukupan pasokan dari supply_reliability_fraction backend. */
const KecukupanSection = ({
  metrics,
  targetFraction,
}: KecukupanSectionProps) => {
  const reliability = metrics.supply_reliability_fraction;
  const servedPct = reliability === null ? null : reliability * 100;
  const targetPct = targetFraction * 100;
  const meetsTarget = servedPct !== null && servedPct + 1e-9 >= targetPct;

  return (
    <SectionCard
      icon={IconShieldCheck}
      title="Kecukupan pasokan"
      description="Energi terpenuhi dibanding kebutuhan."
    >
      <div className="flex items-center gap-6">
        {servedPct === null ? (
          <p className="text-fg-secondary text-small">
            Backend tidak mengirim nilai keandalan pasokan.
          </p>
        ) : (
          <SupplyDonut servedPct={servedPct} />
        )}
        <dl className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-fg-secondary text-small">Energi terpenuhi</dt>
            <dd className="text-value">
              {metrics.annual_supplied_kwh === null
                ? "—"
                : `${formatNumber(metrics.annual_supplied_kwh, 0)} kWh/tahun`}
            </dd>
          </div>
          {servedPct !== null && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-fg-secondary text-small">Target pemenuhan</dt>
              <dd className="text-value">{formatPercent(targetPct, 1)}</dd>
              <dd
                className={cn(
                  "text-small",
                  meetsTarget ? "text-success" : "text-danger",
                )}
              >
                {meetsTarget ? "Tercapai" : "Belum tercapai"}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </SectionCard>
  );
};

export default KecukupanSection;
