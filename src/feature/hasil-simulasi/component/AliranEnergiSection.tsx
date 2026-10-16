import { IconBolt } from "@tabler/icons-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/component/SegmentedTabs";
import { DISPATCH_SERIES, LOAD_SERIES, SCENARIO_META } from "../data";
import type { ResultSummary } from "../util/summarize-result";
import DispatchChart from "./DispatchChart";

const DispatchLegend = () => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
    {DISPATCH_SERIES.map((series) => (
      <li
        key={series.key}
        className="flex items-center gap-1.5 text-fg-secondary text-small"
      >
        <span
          aria-hidden
          className={cn("size-2.5 rounded-[2px]", series.swatchClass)}
        />
        {series.label}
      </li>
    ))}
    <li className="flex items-center gap-1.5 text-fg-secondary text-small">
      <span
        aria-hidden
        className={cn("h-0.5 w-3.5", LOAD_SERIES.swatchClass)}
      />
      {LOAD_SERIES.label}
    </li>
  </ul>
);

interface AliranEnergiSectionProps {
  summary: ResultSummary;
}

const AliranEnergiSection = ({ summary }: AliranEnergiSectionProps) => {
  const scenarios: ScenarioResult[] = [summary.baseline, summary.hybrid];

  return (
    <Tabs defaultValue="hybrid" className="w-full gap-0">
      <SectionCard
        icon={IconBolt}
        title="6. Aliran energi harian"
        description="Daya rata-rata per jam pada hari tipikal (kW)."
        action={
          <SegmentedTabsList aria-label="Skenario aliran energi">
            {scenarios.map((scenario) => (
              <SegmentedTabsTrigger key={scenario.key} value={scenario.key}>
                {SCENARIO_META[scenario.key].name}
              </SegmentedTabsTrigger>
            ))}
          </SegmentedTabsList>
        }
        className="h-full"
      >
        <DispatchLegend />
        {scenarios.map((scenario) => (
          <TabsContent key={scenario.key} value={scenario.key} className="mt-0">
            <DispatchChart
              dispatch={scenario.typical_day_dispatch}
              ariaLabel={`Aliran energi harian skenario ${SCENARIO_META[scenario.key].label}`}
            />
          </TabsContent>
        ))}
      </SectionCard>
    </Tabs>
  );
};

export default AliranEnergiSection;
