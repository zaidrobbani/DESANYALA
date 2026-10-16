import { IconArrowLeft, IconCircleX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type {
  ScenarioFailure,
  ScenarioResult,
  SimulationInputPath,
  SimulationResult,
} from "@/repository/simulation/dto";
import SolverLogPanel from "@/shared/component/SolverLogPanel";
import SourceBadge from "@/shared/component/SourceBadge";
import StatusBanner from "@/shared/component/StatusBanner";
import { SCENARIO_META } from "../data";
import BaselineAvailablePanel from "./BaselineAvailablePanel";
import ConflictIssuesPanel from "./ConflictIssuesPanel";

interface InfeasibleViewProps {
  result: SimulationResult;
  failure: ScenarioFailure;
  baseline: ScenarioResult | undefined;
  onEditField: (path: SimulationInputPath) => void;
  onViewBaseline: () => void;
  onBackToInput: () => void;
}

/**
 * Figma frame 04: satu skenario infeasible. Angka skenario itu sengaja
 * tidak ditampilkan; yang ada diagnosis, log asli, dan baseline pembanding.
 */
const InfeasibleView = ({
  result,
  failure,
  baseline,
  onEditField,
  onViewBaseline,
  onBackToInput,
}: InfeasibleViewProps) => {
  const failedName = SCENARIO_META[failure.key].name.toLowerCase();
  const solvedNames = result.scenarios
    .map((scenario) => SCENARIO_META[scenario.key].name)
    .join(" dan ");
  const { solver } = result;

  return (
    <>
      <StatusBanner
        icon={IconCircleX}
        iconClassName="text-danger"
        title={`Solver: ${failure.model_status.toLowerCase()} (skenario ${failedName})`}
        titleClassName="text-danger"
        description={[
          solvedNames && `${solvedNames} selesai dengan status optimal.`,
          `Skenario ${failedName} tidak punya solusi yang memenuhi semua batasan model.`,
        ]
          .filter(Boolean)
          .join(" ")}
        meta={[
          `${solver.name} ${solver.version}`,
          `Model status: ${failure.model_status}`,
          failure.detected_at && `terdeteksi saat ${failure.detected_at}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <ConflictIssuesPanel
          issues={failure.issues}
          onEditField={onEditField}
        />
        <div className="flex flex-col gap-5">
          <SolverLogPanel
            logs={failure.logs}
            title="Log solver (asli)"
            badge={<SourceBadge tone="neutral">Tidak disamarkan</SourceBadge>}
          />
          {baseline && (
            <BaselineAvailablePanel
              baseline={baseline}
              onViewBaseline={onViewBaseline}
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
