import { IconArrowLeft, IconCircleX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type {
  OptimizationUnits,
  ScenarioKey,
  ScenarioResult,
  SimulationRequest,
  SolverLogLine,
} from "@/repository/simulation/dto";
import SolverLogPanel from "@/shared/component/SolverLogPanel";
import SourceBadge from "@/shared/component/SourceBadge";
import StatusBanner from "@/shared/component/StatusBanner";
import { type InputField, SCENARIO_META } from "../data";
import { diagnoseFailure } from "../util/diagnose";
import ConflictIssuesPanel from "./ConflictIssuesPanel";
import OtherScenarioPanel from "./OtherScenarioPanel";

interface InfeasibleViewProps {
  scenario: ScenarioResult;
  input: SimulationRequest;
  units: OptimizationUnits;
  /** Skenario lain yang punya solusi, untuk pembanding. */
  alternative: ScenarioResult | null;
  onEditField: (field: InputField) => void;
  onSelectScenario: (key: ScenarioKey) => void;
  onBackToInput: () => void;
}

/**
 * Skenario tanpa solusi (infeasible/error). Angkanya sengaja tidak
 * ditampilkan; yang ada pesan backend apa adanya, dugaan parameter, dan
 * skenario lain sebagai pembanding.
 */
const InfeasibleView = ({
  scenario,
  input,
  units,
  alternative,
  onEditField,
  onSelectScenario,
  onBackToInput,
}: InfeasibleViewProps) => {
  const label =
    SCENARIO_META[scenario.scenario_id]?.label ?? scenario.scenario_name;
  const { validation } = scenario;
  const logs: SolverLogLine[] = [
    { level: "command", text: `> scenario ${scenario.scenario_id}` },
    { level: "error", text: `status: ${scenario.status}` },
    ...(validation.solver_message
      ? [{ level: "error" as const, text: validation.solver_message }]
      : []),
    ...validation.warnings.map((warning) => ({
      level: "warning" as const,
      text: `! ${warning}`,
    })),
  ];

  return (
    <>
      <StatusBanner
        icon={IconCircleX}
        iconClassName="text-danger"
        title={`Skenario ${label}: ${scenario.status}`}
        titleClassName="text-danger"
        description={`${label} tidak punya solusi yang memenuhi semua batasan model, jadi angkanya tidak ditampilkan agar tidak menyesatkan.`}
        meta={validation.solver_message ?? undefined}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <ConflictIssuesPanel
          issues={diagnoseFailure(scenario, input)}
          onEditField={onEditField}
        />
        <div className="flex flex-col gap-5">
          <SolverLogPanel
            logs={logs}
            title="Pesan backend (asli)"
            badge={<SourceBadge tone="neutral">Tidak disamarkan</SourceBadge>}
          />
          {alternative && (
            <OtherScenarioPanel
              scenario={alternative}
              units={units}
              onSelect={() => onSelectScenario(alternative.scenario_id)}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-fg-tertiary text-small">
          Ubah satu parameter dalam satu waktu agar penyebabnya jelas.
        </p>
        <Button
          type="button"
          onClick={onBackToInput}
          className="h-[38px] gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
        >
          <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
          Kembali ke input
        </Button>
      </div>
    </>
  );
};

export default InfeasibleView;
