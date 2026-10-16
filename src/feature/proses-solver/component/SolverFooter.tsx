import { IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SimulationStatus } from "@/repository/simulation/dto";

const OUTLINE_CLASS =
  "h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary";

interface SolverFooterProps {
  status: SimulationStatus | null;
  /** Hasil bisa dibuka (semua selesai, atau sebagian skenario optimal). */
  canViewResult: boolean;
  isCancelling: boolean;
  onCancel: () => void;
  onBackToInput: () => void;
  onViewResult: () => void;
}

const SolverFooter = ({
  status,
  canViewResult,
  isCancelling,
  onCancel,
  onBackToInput,
  onViewResult,
}: SolverFooterProps) => {
  const isActive =
    status === null || status === "queued" || status === "running";

  return (
    <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      {isActive ? (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isCancelling || status === null}
          className={OUTLINE_CLASS}
        >
          {isCancelling ? (
            <Spinner className="size-4" />
          ) : (
            <IconX aria-hidden className="size-4" stroke={1.75} />
          )}
          Batalkan
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onBackToInput}
          className={OUTLINE_CLASS}
        >
          <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
          {status === "completed" ? "Kembali ke input" : "Ubah input"}
        </Button>
      )}

      {canViewResult ? (
        <Button
          type="button"
          onClick={onViewResult}
          className="h-[38px] gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
        >
          Lihat hasil
          <IconArrowRight aria-hidden className="size-4" stroke={1.75} />
        </Button>
      ) : (
        <p className="text-center text-fg-tertiary text-small">
          {status === "failed"
            ? "Periksa kapasitas dan batas di input, lalu jalankan ulang."
            : "Simulasi 365 hari bisa memakan beberapa menit."}
        </p>
      )}
    </div>
  );
};

export default SolverFooter;
