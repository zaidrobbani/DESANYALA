import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { RESULT_DISCLAIMER } from "../data";

interface HasilFooterProps {
  onBackToInput: () => void;
  onNewSimulation: () => void;
}

const HasilFooter = ({ onBackToInput, onNewSimulation }: HasilFooterProps) => {
  return (
    <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:gap-6">
      <p className="flex-1 text-fg-secondary text-small">{RESULT_DISCLAIMER}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToInput}
          className="h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary"
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
    </div>
  );
};

export default HasilFooter;
