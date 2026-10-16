import { IconChartBar } from "@tabler/icons-react";
import type { ScenarioMetrics } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";
import MetricValue from "./MetricValue";
import ValueBarChart from "./ValueBarChart";

interface RingkasanEnergiSectionProps {
  metrics: ScenarioMetrics;
  periodDays: number;
}

/** Ringkasan energi tahunan (#energyChart, #co2Value, #shortageValue). */
const RingkasanEnergiSection = ({
  metrics,
  periodDays,
}: RingkasanEnergiSectionProps) => {
  const bars = [
    {
      key: "demand",
      label: "Kebutuhan",
      value: metrics.annual_demand_kwh,
      color: "var(--energy-load)",
    },
    {
      key: "pv",
      label: "PV",
      value: metrics.annual_pv_generation_kwh,
      color: "var(--energy-pv)",
    },
    {
      key: "genset",
      label: "Genset",
      value: metrics.annual_genset_generation_kwh,
      color: "var(--energy-diesel)",
    },
    {
      key: "excess",
      label: "Surplus",
      value: metrics.annual_excess_energy_kwh,
      color: "var(--energy-battery-charge)",
    },
  ].flatMap((bar) =>
    bar.value === null ? [] : [{ ...bar, value: bar.value }],
  );

  return (
    <SectionCard
      icon={IconChartBar}
      title="Ringkasan energi tahunan"
      description={`Distribusi energi model dari simulasi ${formatNumber(periodDays)} hari (kWh/tahun).`}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="text-body-strong text-fg-secondary">
            Kebutuhan dan produksi setiap sumber
          </figcaption>
          <ValueBarChart
            ariaLabel="Perbandingan energi tahunan"
            data={bars}
            formatValue={(value) => formatNumber(value, 0)}
            className="h-[220px]"
          />
        </figure>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 rounded-lg bg-subtle p-4">
            <dt className="text-fg-secondary text-small">
              Emisi tahunan estimasi
            </dt>
            <dd>
              <MetricValue
                value={
                  metrics.annual_co2_kg === null
                    ? "—"
                    : formatNumber(metrics.annual_co2_kg, 0)
                }
                unit="kg CO₂-eq"
              />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-subtle p-4">
            <dt className="text-fg-secondary text-small">
              Energi tak terpenuhi
            </dt>
            <dd>
              <MetricValue
                value={
                  metrics.annual_unmet_energy_kwh === null
                    ? "—"
                    : formatNumber(metrics.annual_unmet_energy_kwh, 2)
                }
                unit="kWh/tahun"
              />
            </dd>
          </div>
          <p className="text-fg-tertiary text-small">
            Angka emisi bergantung pada faktor emisi di template engine. Periksa
            sumbernya sebelum dipakai untuk pelaporan formal.
          </p>
        </dl>
      </div>
    </SectionCard>
  );
};

export default RingkasanEnergiSection;
