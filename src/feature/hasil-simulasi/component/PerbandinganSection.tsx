import { IconScale } from "@tabler/icons-react";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";
import type { ResultSummary } from "../util/summarize-result";
import ScenarioBarChart from "./ScenarioBarChart";
import ScenarioLegend from "./ScenarioLegend";

interface PerbandinganSectionProps {
  summary: ResultSummary;
}

const PerbandinganSection = ({ summary }: PerbandinganSectionProps) => {
  const { baseline, hybrid } = summary;

  return (
    <SectionCard
      icon={IconScale}
      title="3. Perbandingan skenario"
      description="Satuan NPC dan LCOE berbeda, jadi ditampilkan sebagai dua grafik terpisah."
    >
      <ScenarioLegend />
      <div className="grid gap-6 sm:grid-cols-2">
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="text-body-strong text-fg-secondary">
            NPC {formatNumber(summary.lifetimeYears)} tahun (miliar Rp)
          </figcaption>
          <ScenarioBarChart
            ariaLabel="Perbandingan NPC diesel saja dan hybrid"
            data={[
              { key: "baseline", value: baseline.npc_idr / 1e9 },
              { key: "hybrid", value: hybrid.npc_idr / 1e9 },
            ]}
            formatValue={(value) => formatNumber(value, 1, 1)}
          />
        </figure>
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="text-body-strong text-fg-secondary">
            LCOE (Rp/kWh)
          </figcaption>
          <ScenarioBarChart
            ariaLabel="Perbandingan LCOE diesel saja dan hybrid"
            data={[
              { key: "baseline", value: baseline.lcoe_idr_per_kwh },
              { key: "hybrid", value: hybrid.lcoe_idr_per_kwh },
            ]}
            formatValue={(value) => formatNumber(value, 0)}
            intervals={5}
          />
        </figure>
      </div>
    </SectionCard>
  );
};

export default PerbandinganSection;
