import { IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  OptimizationUnits,
  ScenarioResult,
} from "@/repository/simulation/dto";
import { formatNumber } from "@/shared/util/number";
import { SCENARIO_META } from "../data";
import MetricValue from "./MetricValue";

interface OtherScenarioPanelProps {
  scenario: ScenarioResult;
  units: OptimizationUnits;
  onSelect: () => void;
}

/** Pengingat bahwa skenario lain tetap punya solusi sebagai pembanding. */
const OtherScenarioPanel = ({
  scenario,
  units,
  onSelect,
}: OtherScenarioPanelProps) => {
  const meta = SCENARIO_META[scenario.scenario_id];
  const { lcoe } = scenario.metrics;
  return (
    <section className="flex w-full flex-col items-start gap-1.5 rounded-lg bg-surface px-4 py-5 sm:px-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2.5 shrink-0 rounded-full", meta.swatchClass)}
        />
        <h2 className="text-h3">{meta.label} tetap tersedia</h2>
      </div>
      <MetricValue
        value={lcoe === null ? "—" : formatNumber(lcoe, lcoe < 10 ? 5 : 2)}
        unit={`${units.lcoe} · LCOE`}
      />
      <p className="text-fg-secondary text-small">
        Status {scenario.status}, bisa dipakai sebagai pembanding.
      </p>
      <Button
        type="button"
        variant="ghost"
        onClick={onSelect}
        className="h-[38px] gap-2 rounded-md px-4 text-body-strong text-brand hover:bg-brand-subtle hover:text-brand"
      >
        Lihat hasil {meta.label}
        <IconChevronRight aria-hidden className="size-4" stroke={1.75} />
      </Button>
    </section>
  );
};

export default OtherScenarioPanel;
