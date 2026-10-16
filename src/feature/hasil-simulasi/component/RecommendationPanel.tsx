import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/shared/util/number";
import { SCENARIO_META } from "../data";
import type { ResultSummary } from "../util/summarize-result";

interface RecommendationPanelProps {
  summary: ResultSummary;
  onDownloadCsv: () => void;
}

/** Panel putih di sisi kanan hero: skenario terpilih + unduh CSV. */
const RecommendationPanel = ({
  summary,
  onDownloadCsv,
}: RecommendationPanelProps) => {
  const { recommended, lcoeReductionPct } = summary;
  const isCheaper = lcoeReductionPct > 0;

  return (
    <div className="flex w-full flex-col gap-1.5 rounded-lg bg-surface px-5 py-4 lg:w-[300px] lg:shrink-0">
      <p className="text-fg-tertiary text-small">Skenario direkomendasikan</p>
      <p className="text-body-strong">{SCENARIO_META[recommended.key].label}</p>
      <p
        className={cn(
          "text-small",
          isCheaper ? "text-success" : "text-fg-secondary",
        )}
      >
        {isCheaper
          ? `LCOE ${formatPercent(lcoeReductionPct)} lebih rendah dari diesel saja`
          : "Hybrid belum lebih murah dari diesel saja"}
      </p>
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
};

export default RecommendationPanel;
