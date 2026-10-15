import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type {
  ScenarioProgress,
  SimulationProgress,
} from "@/repository/simulation/dto";
import { formatDuration, formatNumber } from "@/shared/util/number";
import { RUN_STATUS_META, SCENARIO_CODE_CLASS } from "../data";

const statusDetail = (scenario: ScenarioProgress, elapsedSeconds: number) => {
  switch (scenario.status) {
    case "running":
      return formatDuration(elapsedSeconds);
    case "optimal":
    case "infeasible":
    case "error":
      return scenario.duration_seconds !== null
        ? `${formatNumber(scenario.duration_seconds, 1)} detik`
        : "";
    case "skipped":
      return "Skenario sebelumnya gagal";
    default:
      return "";
  }
};

interface ScenarioRowProps {
  scenario: ScenarioProgress;
  elapsedSeconds: number;
}

const ScenarioRow = ({ scenario, elapsedSeconds }: ScenarioRowProps) => {
  const meta = RUN_STATUS_META[scenario.status];
  const percent = Math.round(scenario.progress * 100);

  return (
    <li className="flex flex-col gap-3 border-line border-b py-4 last:border-b-0 md:flex-row md:items-center md:gap-6">
      <div className="flex flex-col gap-0.5 md:w-[320px] md:shrink-0">
        <span className={cn("text-label", SCENARIO_CODE_CLASS[scenario.key])}>
          {scenario.code}
        </span>
        <span className="text-body-strong">{scenario.label}</span>
      </div>

      <Progress
        value={percent}
        aria-label={`Progres ${scenario.label}`}
        className={cn(
          "h-1.5 flex-1 rounded-[3px] bg-track md:max-w-[600px]",
          meta.barClass,
        )}
      />

      <div className="flex items-baseline justify-between gap-2 md:w-[160px] md:shrink-0 md:flex-col md:items-end md:gap-0.5">
        <span className={cn("text-body-strong", meta.textClass)}>
          {meta.label}
        </span>
        <span className="text-fg-tertiary text-num-sm">
          {statusDetail(scenario, elapsedSeconds)}
        </span>
      </div>
    </li>
  );
};

interface ScenarioProgressPanelProps {
  progress: SimulationProgress;
}

const ScenarioProgressPanel = ({ progress }: ScenarioProgressPanelProps) => {
  return (
    <section
      aria-label="Progres skenario"
      className="w-full rounded-lg bg-surface px-4 py-2 sm:px-6"
    >
      <ol>
        {progress.scenarios.map((scenario) => (
          <ScenarioRow
            key={scenario.key}
            scenario={scenario}
            elapsedSeconds={progress.elapsed_seconds}
          />
        ))}
      </ol>
    </section>
  );
};

export default ScenarioProgressPanel;
