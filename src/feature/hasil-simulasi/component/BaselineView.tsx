import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type {
  ScenarioResult,
  SimulationResult,
} from "@/repository/simulation/dto";
import AliranEnergiSection from "./AliranEnergiSection";
import BaselineBiayaSection from "./BaselineBiayaSection";
import KecukupanSection from "./KecukupanSection";
import ResultSolverBanner from "./ResultSolverBanner";

const OUTLINE_CLASS =
  "h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary";

interface BaselineViewProps {
  result: SimulationResult;
  baseline: ScenarioResult;
  /** Ada bila dibuka dari diagnosis infeasible. */
  onBackToDiagnosis?: () => void;
  onBackToInput: () => void;
  onNewSimulation: () => void;
}

/** Hasil diesel saja, dipakai saat hybrid infeasible atau tidak dijalankan. */
const BaselineView = ({
  result,
  baseline,
  onBackToDiagnosis,
  onBackToInput,
  onNewSimulation,
}: BaselineViewProps) => (
  <>
    <ResultSolverBanner result={result} />
    <BaselineBiayaSection
      scenario={baseline}
      economics={result.input.economics}
    />
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <KecukupanSection
        scenario={baseline}
        maxUnservedPct={result.input.max_unserved_energy_pct}
      />
      <AliranEnergiSection scenarios={[baseline]} />
    </div>

    <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
      {onBackToDiagnosis && (
        <Button
          type="button"
          variant="outline"
          onClick={onBackToDiagnosis}
          className={OUTLINE_CLASS}
        >
          <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
          Kembali ke diagnosis
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onBackToInput}
        className={OUTLINE_CLASS}
      >
        <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
        Kembali ke input
      </Button>
      <Button
        type="button"
        onClick={onNewSimulation}
        className="h-[38px] gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
      >
        <IconRefresh aria-hidden className="size-4" stroke={1.75} />
        Jalankan simulasi baru
      </Button>
    </div>
  </>
);

export default BaselineView;
