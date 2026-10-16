import { IconChevronRight, IconEngine } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { ScenarioResult } from "@/repository/simulation/dto";
import { formatNumber } from "@/shared/util/number";
import MetricValue from "./MetricValue";

interface BaselineAvailablePanelProps {
  baseline: ScenarioResult;
  onViewBaseline: () => void;
}

/** Pengingat bahwa hasil diesel saja tetap bisa dipakai sebagai pembanding. */
const BaselineAvailablePanel = ({
  baseline,
  onViewBaseline,
}: BaselineAvailablePanelProps) => (
  <section className="flex w-full flex-col items-start gap-1.5 rounded-lg bg-surface px-4 py-5 sm:px-6">
    <div className="flex items-center gap-2">
      <IconEngine
        aria-hidden
        className="size-5 shrink-0 text-energy-diesel"
        stroke={1.75}
      />
      <h2 className="text-h3">Baseline tetap tersedia</h2>
    </div>
    <MetricValue
      value={formatNumber(baseline.lcoe_idr_per_kwh, 0)}
      unit="Rp/kWh · diesel saja"
    />
    <p className="text-fg-secondary text-small">
      Status optimal, bisa dilihat sebagai pembanding.
    </p>
    <Button
      type="button"
      variant="ghost"
      onClick={onViewBaseline}
      className="h-[38px] gap-2 rounded-md px-4 text-body-strong text-brand hover:bg-brand-subtle hover:text-brand"
    >
      Lihat hasil baseline
      <IconChevronRight aria-hidden className="size-4" stroke={1.75} />
    </Button>
  </section>
);

export default BaselineAvailablePanel;
