import { IconReportMoney } from "@tabler/icons-react";
import type {
  ScenarioResult,
  SimulationRequest,
} from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatIdrCompact, formatNumber } from "@/shared/util/number";
import MetricValue from "./MetricValue";

interface BaselineBiayaSectionProps {
  scenario: ScenarioResult;
  economics: SimulationRequest["economics"];
}

/** Ringkasan biaya satu skenario (tanpa pembanding). */
const BaselineBiayaSection = ({
  scenario,
  economics,
}: BaselineBiayaSectionProps) => {
  const npc = formatIdrCompact(scenario.npc_idr);
  const opex = formatIdrCompact(scenario.opex_idr_per_year, 2);
  const metrics = [
    { label: "Net present cost (NPC)", value: npc.value, unit: npc.unit },
    {
      label: "Biaya energi (LCOE)",
      value: formatNumber(scenario.lcoe_idr_per_kwh, 0),
      unit: "Rp/kWh",
    },
    {
      label: "Biaya operasi (OPEX)",
      value: opex.value,
      unit: `${opex.unit}/tahun`,
    },
    {
      label: "Konsumsi solar",
      value: `≈ ${formatNumber(Math.round(scenario.fuel_liters_per_year / 100) * 100, 0)}`,
      unit: "liter/tahun",
    },
  ];

  return (
    <SectionCard
      icon={IconReportMoney}
      title="Ringkasan biaya diesel saja"
      description={`Nilai kini selama ${formatNumber(economics.project_lifetime_years)} tahun, kurs ${formatNumber(economics.usd_idr_rate)} Rp/USD.`}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <li
            key={metric.label}
            className="flex min-w-0 flex-col gap-0.5 rounded-lg bg-subtle p-4"
          >
            <span className="text-fg-secondary text-small">{metric.label}</span>
            <MetricValue value={metric.value} unit={metric.unit} />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};

export default BaselineBiayaSection;
