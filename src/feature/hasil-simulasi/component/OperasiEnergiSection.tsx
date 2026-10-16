"use client";

import { IconBolt } from "@tabler/icons-react";
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ScenarioResult } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/component/SegmentedTabs";
import { formatNumber } from "@/shared/util/number";
import {
  CHART_MODES,
  type ChartMode,
  DEMAND_SERIES,
  DETAIL_INTERVALS,
  SCENARIO_META,
  SOC_SERIES,
  SUPPLY_SERIES,
  TIME_MODES,
  type TimeMode,
  UNMET_SERIES,
} from "../data";
import {
  aggregateDaily,
  dailyChartRows,
  detailChartRows,
  hasBattery,
} from "../util/result-view";
import EnergyChart from "./EnergyChart";

type LegendItem = { key: string; label: string; swatchClass: string };

const Legend = ({ items }: { items: LegendItem[] }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
    {items.map((item) => (
      <li
        key={item.key}
        className="flex items-center gap-1.5 text-fg-secondary text-small"
      >
        <span
          aria-hidden
          className={cn(
            item.key === DEMAND_SERIES.key || item.key === SOC_SERIES.key
              ? "h-0.5 w-3.5"
              : "size-2.5 rounded-[2px]",
            item.swatchClass,
          )}
        />
        {item.label}
      </li>
    ))}
  </ul>
);

interface OperasiEnergiSectionProps {
  scenario: ScenarioResult;
  periodDays: number;
  stepHours: number;
}

const OperasiEnergiSection = ({
  scenario,
  periodDays,
  stepHours,
}: OperasiEnergiSectionProps) => {
  const [timeMode, setTimeMode] = useState<TimeMode>("year");
  const [chartMode, setChartMode] = useState<ChartMode>("power");
  const withBattery = hasBattery(scenario);
  const mode: ChartMode = withBattery ? chartMode : "power";

  const isDaily = timeMode === "year";
  const rows = isDaily
    ? dailyChartRows(aggregateDaily(scenario.dispatch, stepHours))
    : detailChartRows(scenario.dispatch);
  const withUnmet = rows.some((row) => row.unmet > 1e-6);
  const unit = isDaily ? "kWh" : "kW";

  const legend: LegendItem[] =
    mode === "storage"
      ? [
          ...SUPPLY_SERIES.filter(
            (s) => s.key === "charge" || s.key === "discharge",
          ),
          SOC_SERIES,
        ]
      : [
          ...SUPPLY_SERIES.filter(
            (s) => withBattery || (s.key !== "charge" && s.key !== "discharge"),
          ),
          ...(withUnmet ? [UNMET_SERIES] : []),
          DEMAND_SERIES,
        ];

  const timeLabel = (value: TimeMode) =>
    value === "year"
      ? `Ringkasan ${formatNumber(periodDays)} hari`
      : TIME_MODES.find((m) => m.value === value)?.label;

  return (
    <SectionCard
      icon={IconBolt}
      title="Operasi energi"
      description="Aliran daya menurut profil permintaan, produksi PV, genset, dan penyimpanan."
      action={
        <div className="flex flex-wrap gap-2">
          <Tabs
            value={timeMode}
            onValueChange={(value) => setTimeMode(value as TimeMode)}
            className="gap-0"
          >
            <SegmentedTabsList aria-label="Rentang waktu grafik">
              {TIME_MODES.map((option) => (
                <SegmentedTabsTrigger key={option.value} value={option.value}>
                  {timeLabel(option.value)}
                </SegmentedTabsTrigger>
              ))}
            </SegmentedTabsList>
          </Tabs>
          {withBattery && (
            <Tabs
              value={chartMode}
              onValueChange={(value) => setChartMode(value as ChartMode)}
              className="gap-0"
            >
              <SegmentedTabsList aria-label="Jenis grafik">
                {CHART_MODES.map((option) => (
                  <SegmentedTabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </SegmentedTabsTrigger>
                ))}
              </SegmentedTabsList>
            </Tabs>
          )}
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-fg-secondary text-small">
          Dispatch per jam tidak tersedia untuk skenario ini (backend tidak
          mengirim data dispatch, atau data hanya tersimpan selama tab ini
          terbuka).
        </p>
      ) : (
        <>
          <Legend items={legend} />
          <EnergyChart
            rows={rows}
            mode={mode}
            unit={unit}
            withBattery={withBattery}
            withUnmet={withUnmet}
            tickInterval={
              isDaily ? Math.max(0, Math.ceil(rows.length / 8) - 1) : 11
            }
            ariaLabel={`Operasi energi skenario ${SCENARIO_META[scenario.scenario_id]?.label ?? scenario.scenario_name}`}
          />
          <p className="text-fg-tertiary text-small">
            {isDaily
              ? `Total energi per hari (kWh/hari) dari setiap ${formatNumber(24 / stepHours)} interval dispatch.`
              : `Detail ${formatNumber(DETAIL_INTERVALS)} interval pertama dalam kW; SOC dalam persen.`}{" "}
            Tanggal mengikuti tahun referensi engine, bukan kalender nyata.
          </p>
        </>
      )}
    </SectionCard>
  );
};

export default OperasiEnergiSection;
