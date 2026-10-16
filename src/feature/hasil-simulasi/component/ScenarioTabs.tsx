import { Tabs } from "@/components/ui/tabs";
import type {
  OptimizationResponse,
  ScenarioKey,
} from "@/repository/simulation/dto";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/component/SegmentedTabs";
import { RUN_STATUS_META, SCENARIO_META, SCENARIO_ORDER } from "../data";
import { isUsableScenario } from "../util/result-view";

interface ScenarioTabsProps {
  response: OptimizationResponse;
  value: ScenarioKey;
  onChange: (key: ScenarioKey) => void;
}

/** Pilihan skenario hasil ([data-scenario] di referensi). */
const ScenarioTabs = ({ response, value, onChange }: ScenarioTabsProps) => (
  <Tabs
    value={value}
    onValueChange={(next) => onChange(next as ScenarioKey)}
    className="gap-0 print:hidden"
  >
    <SegmentedTabsList
      aria-label="Pilih skenario hasil"
      className="flex w-full flex-wrap justify-start sm:w-fit"
    >
      {SCENARIO_ORDER.map((key) => {
        const scenario = response.scenario_results.find(
          (s) => s.scenario_id === key,
        );
        const suffix = !scenario
          ? " · tidak dijalankan"
          : isUsableScenario(scenario)
            ? ""
            : ` · ${RUN_STATUS_META[scenario.status].label.toLowerCase()}`;
        return (
          <SegmentedTabsTrigger key={key} value={key} disabled={!scenario}>
            {SCENARIO_META[key].label}
            {suffix && (
              <span className="font-normal text-fg-tertiary">{suffix}</span>
            )}
          </SegmentedTabsTrigger>
        );
      })}
    </SegmentedTabsList>
  </Tabs>
);

export default ScenarioTabs;
