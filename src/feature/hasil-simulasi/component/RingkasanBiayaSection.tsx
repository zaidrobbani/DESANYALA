import { IconReportMoney } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { SimulationRequest } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import {
  formatIdrCompact,
  formatNumber,
  formatPercent,
} from "@/shared/util/number";
import type { ResultSummary } from "../util/summarize-result";
import MetricValue from "./MetricValue";

interface RingkasanBiayaSectionProps {
  summary: ResultSummary;
  economics: SimulationRequest["economics"];
}

const idr = (value: number, billionDigits = 1) => {
  const { value: text, unit } = formatIdrCompact(value, billionDigits);
  return `${text} ${unit}`;
};

/** "14,2 miliar": angka pembanding tanpa "Rp" (satuan sudah jelas). */
const idrWithoutCurrency = (value: number, billionDigits = 1) => {
  const { value: text, unit } = formatIdrCompact(value, billionDigits);
  return `${text} ${unit.replace(/ ?Rp$/, "")}`.trim();
};

const RingkasanBiayaSection = ({
  summary,
  economics,
}: RingkasanBiayaSectionProps) => {
  const { baseline, hybrid, lcoeReductionPct, npcReductionPct } = summary;
  const npc = formatIdrCompact(hybrid.npc_idr);
  const isCheaper = lcoeReductionPct > 0 && npcReductionPct > 0;

  const opexChange =
    hybrid.opex_idr_per_year <= baseline.opex_idr_per_year ? "turun" : "naik";

  return (
    <SectionCard
      icon={IconReportMoney}
      title="2. Ringkasan biaya"
      description={`Nilai kini selama ${formatNumber(economics.project_lifetime_years)} tahun, kurs ${formatNumber(economics.usd_idr_rate)} Rp/USD.`}
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-fg-secondary text-small">Net present cost (NPC)</p>
          <MetricValue value={npc.value} unit={npc.unit} />
          <p className="text-fg-tertiary text-small">
            dari {idrWithoutCurrency(baseline.npc_idr)} diesel saja
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 border-line border-l pl-6">
          <p className="text-fg-secondary text-small">Biaya energi (LCOE)</p>
          <MetricValue
            value={formatNumber(hybrid.lcoe_idr_per_kwh, 0)}
            unit="Rp/kWh"
          />
          <p className="text-fg-tertiary text-small">
            dari {formatNumber(baseline.lcoe_idr_per_kwh, 0)} Rp/kWh diesel saja
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-0.5 rounded-lg px-4 py-3",
          isCheaper ? "bg-brand-subtle" : "bg-subtle",
        )}
      >
        <p
          className={cn(
            "text-body-strong",
            isCheaper ? "text-brand" : "text-fg-primary",
          )}
        >
          {isCheaper
            ? `LCOE ${formatPercent(lcoeReductionPct)} dan NPC ${formatPercent(npcReductionPct)} lebih rendah`
            : "Hybrid belum lebih murah dari diesel saja"}
        </p>
        <p className="text-fg-secondary text-small">
          CAPEX tambahan {idr(hybrid.capex_idr, 2)} · OPEX {opexChange} dari{" "}
          {idrWithoutCurrency(baseline.opex_idr_per_year, 2)} menjadi{" "}
          {idr(hybrid.opex_idr_per_year, 2)}/tahun
        </p>
      </div>
    </SectionCard>
  );
};

export default RingkasanBiayaSection;
