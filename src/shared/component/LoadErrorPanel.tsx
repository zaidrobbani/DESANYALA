import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface LoadErrorPanelProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onBack: () => void;
  backLabel?: string;
}

/** Panel gagal memuat data: pesan + "Coba lagi" (opsional) + kembali. */
const LoadErrorPanel = ({
  title,
  message,
  onRetry,
  onBack,
  backLabel = "Ke input",
}: LoadErrorPanelProps) => {
  return (
    <section
      role="alert"
      className="flex w-full flex-col items-start gap-3 rounded-md bg-surface px-4 py-3.5 sm:flex-row sm:items-center"
    >
      <IconAlertTriangle
        aria-hidden
        className="size-[18px] shrink-0 text-danger"
        stroke={1.75}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="text-body-strong text-danger">{title}</h2>
        <p className="text-fg-primary text-small">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="h-10 rounded-md border-line-strong px-4 text-body-strong"
          >
            Coba lagi
          </Button>
        )}
        <Button
          type="button"
          onClick={onBack}
          className="h-10 gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
        >
          <IconArrowLeft aria-hidden className="size-4" stroke={1.75} />
          {backLabel}
        </Button>
      </div>
    </section>
  );
};

export default LoadErrorPanel;
