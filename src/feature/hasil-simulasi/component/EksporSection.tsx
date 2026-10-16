import {
  IconBraces,
  IconFileExport,
  IconPrinter,
  IconTable,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";
import { DETAIL_INTERVALS } from "../data";

const BUTTON_CLASS =
  "h-10 w-full justify-start gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary";

interface EksporSectionProps {
  hasDispatch: boolean;
  periodDays: number;
  onDownloadJson: () => void;
  onDownloadDispatch: () => void;
  onDownloadDaily: () => void;
  onPrint: () => void;
}

/** Ekspor hasil (#downloadJson, #downloadDispatch, #downloadDaily, #printReport). */
const EksporSection = ({
  hasDispatch,
  periodDays,
  onDownloadJson,
  onDownloadDispatch,
  onDownloadDaily,
  onPrint,
}: EksporSectionProps) => (
  <SectionCard
    icon={IconFileExport}
    title="Hasil per jam"
    description="Ekspor data operasi untuk analisis lebih lanjut."
    className="print:hidden"
  >
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onDownloadJson}
        className={BUTTON_CLASS}
      >
        <IconBraces aria-hidden className="size-4" stroke={1.75} />
        Unduh ringkasan JSON
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onDownloadDispatch}
        disabled={!hasDispatch}
        className={BUTTON_CLASS}
      >
        <IconTable aria-hidden className="size-4" stroke={1.75} />
        Unduh {formatNumber(DETAIL_INTERVALS)} interval pertama (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onDownloadDaily}
        disabled={!hasDispatch}
        className={BUTTON_CLASS}
      >
        <IconTable aria-hidden className="size-4" stroke={1.75} />
        Unduh ringkasan {formatNumber(periodDays)} hari (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onPrint}
        className={BUTTON_CLASS}
      >
        <IconPrinter aria-hidden className="size-4" stroke={1.75} />
        Cetak / simpan PDF
      </Button>
    </div>
    {!hasDispatch && (
      <p className="text-fg-tertiary text-small">
        Dispatch per jam tidak tersedia untuk skenario ini.
      </p>
    )}
  </SectionCard>
);

export default EksporSection;
