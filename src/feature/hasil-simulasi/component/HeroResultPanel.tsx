import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroResultPanelProps {
  label: string;
  title: string;
  note: string;
  noteClassName?: string;
  onDownloadCsv: () => void;
}

/** Panel putih di sisi kanan hero (Figma: Recommendation Panel). */
const HeroResultPanel = ({
  label,
  title,
  note,
  noteClassName,
  onDownloadCsv,
}: HeroResultPanelProps) => (
  <div className="flex w-full flex-col gap-1.5 rounded-lg bg-surface px-5 py-4 lg:w-[300px] lg:shrink-0">
    <p className="text-fg-tertiary text-small">{label}</p>
    <p className="text-body-strong">{title}</p>
    <p className={cn("text-fg-secondary text-small", noteClassName)}>{note}</p>
    <Button
      type="button"
      variant="outline"
      onClick={onDownloadCsv}
      className="h-10 w-full gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary"
    >
      <IconDownload aria-hidden className="size-4" stroke={1.75} />
      Unduh hasil CSV
    </Button>
  </div>
);

export default HeroResultPanel;
