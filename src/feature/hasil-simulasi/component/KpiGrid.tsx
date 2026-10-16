import {
  type Icon,
  IconCoin,
  IconGasStation,
  IconPlugConnectedX,
  IconSun,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type {
  OptimizationUnits,
  ScenarioMetrics,
} from "@/repository/simulation/dto";
import { formatNumber, formatPercent } from "@/shared/util/number";
import MetricValue from "./MetricValue";

type Kpi = {
  key: string;
  label: string;
  value: string;
  unit: string;
  foot: string;
  icon: Icon;
  iconClass: string;
};

const orDash = (value: number | null, format: (v: number) => string) =>
  value === null ? "—" : format(value);

interface KpiGridProps {
  metrics: ScenarioMetrics;
  units: OptimizationUnits;
}

/** Kartu KPI utama (#kpis di referensi output). */
const KpiGrid = ({ metrics, units }: KpiGridProps) => {
  const items: Kpi[] = [
    {
      key: "lcoe",
      label: "LCOE",
      value: orDash(metrics.lcoe, (v) => formatNumber(v, v < 10 ? 5 : 2)),
      unit: units.lcoe,
      foot: "Biaya energi rata-rata",
      icon: IconCoin,
      iconClass: "text-brand",
    },
    {
      key: "fuel",
      label: "Konsumsi diesel",
      value: orDash(metrics.annual_fuel_liters, (v) => formatNumber(v, 0)),
      unit: "liter/tahun",
      foot: "Perkiraan tahunan",
      icon: IconGasStation,
      iconClass: "text-energy-diesel",
    },
    {
      key: "renewable",
      label: "Energi terbarukan",
      value: orDash(metrics.renewable_share_fraction, (v) =>
        formatPercent(v * 100, 2),
      ),
      unit: "dari energi tersuplai",
      foot: "Porsi renewable pada model",
      icon: IconSun,
      iconClass: "text-energy-pv-ink",
    },
    {
      key: "unmet",
      label: "Energi tak terpenuhi",
      value: orDash(metrics.annual_unmet_energy_kwh, (v) => formatNumber(v, 2)),
      unit: "kWh/tahun",
      foot: "Berdasarkan output model",
      icon: IconPlugConnectedX,
      iconClass: "text-energy-unserved",
    },
  ];

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex min-w-0 flex-col gap-1 rounded-lg bg-surface p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-fg-secondary text-small">{item.label}</span>
            <item.icon
              aria-hidden
              className={cn("size-5 shrink-0", item.iconClass)}
              stroke={1.75}
            />
          </div>
          <MetricValue
            value={item.value}
            unit={item.unit}
            className="flex-wrap"
          />
          <span className="text-fg-tertiary text-small">{item.foot}</span>
        </li>
      ))}
    </ul>
  );
};

export default KpiGrid;
