"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { niceAxis } from "@/shared/util/chart";
import { formatCompact, formatNumber } from "@/shared/util/number";
import {
  type ChartMode,
  DEMAND_SERIES,
  SOC_SERIES,
  SUPPLY_SERIES,
  UNMET_SERIES,
} from "../data";
import type { EnergyRow } from "../util/result-view";

const chartConfig = Object.fromEntries(
  [...SUPPLY_SERIES, DEMAND_SERIES, SOC_SERIES, UNMET_SERIES].map((series) => [
    series.key,
    { label: series.label, color: series.color },
  ]),
) satisfies ChartConfig;

const AXIS_TICK = { fontSize: 12, fontWeight: 500 };

interface EnergyChartProps {
  rows: EnergyRow[];
  mode: ChartMode;
  /** "kW" (detail per jam) atau "kWh" (total harian). */
  unit: string;
  /** Tampilkan seri baterai (skenario dengan baterai). */
  withBattery: boolean;
  /** Tampilkan seri energi tak terpenuhi bila ada. */
  withUnmet: boolean;
  /** Jarak label sumbu X (jumlah tick yang dilewati). */
  tickInterval: number;
  ariaLabel: string;
}

/**
 * Operasi energi (mainChart di referensi). Mode "power": pasokan ditumpuk di
 * atas nol, pengisian baterai di bawah nol, kebutuhan sebagai garis. Mode
 * "storage": pengisian/pelepasan baterai + SOC (%) di sumbu kanan.
 */
const EnergyChart = ({
  rows,
  mode,
  unit,
  withBattery,
  withUnmet,
  tickInterval,
  ariaLabel,
}: EnergyChartProps) => {
  const supplyKeys = SUPPLY_SERIES.filter((series) =>
    mode === "storage"
      ? series.key === "charge" || series.key === "discharge"
      : withBattery || (series.key !== "charge" && series.key !== "discharge"),
  );
  const maxPositive = Math.max(
    0,
    ...rows.map((r) =>
      mode === "storage"
        ? r.discharge
        : Math.max(r.demand, r.genset + r.pv + (withBattery ? r.discharge : 0)),
    ),
  );
  const maxCharge = withBattery
    ? Math.max(0, ...rows.map((r) => -r.charge))
    : 0;
  const { top, step, ticks } = niceAxis(maxPositive);
  const bottom = maxCharge > 0 ? -Math.ceil(maxCharge / step) * step : 0;
  const negativeTicks = Array.from(
    { length: Math.round(-bottom / step) },
    (_, i) => -(i + 1) * step,
  ).reverse();

  return (
    <ChartContainer
      config={chartConfig}
      role="img"
      aria-label={ariaLabel}
      className="aspect-auto h-[280px] w-full"
    >
      <ComposedChart
        data={rows}
        stackOffset="sign"
        barCategoryGap={rows.length > 120 ? 0 : "20%"}
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--bg-muted)" />
        <XAxis
          dataKey="label"
          interval={tickInterval}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickMargin={8}
          minTickGap={8}
        />
        <YAxis
          yAxisId="energy"
          domain={[bottom, top]}
          ticks={[...negativeTicks, ...ticks]}
          tickFormatter={(value: number) => formatCompact(value)}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
        />
        {mode === "storage" && (
          <YAxis
            yAxisId="soc"
            orientation="right"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value: number) => `${value}%`}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={40}
          />
        )}
        <ReferenceLine yAxisId="energy" y={0} stroke="var(--border-strong)" />
        <ChartTooltip
          cursor={{ fill: "var(--bg-subtle)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.label ?? "")
              }
              formatter={(value, name) => (
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="text-fg-secondary">
                    {chartConfig[name as keyof typeof chartConfig]?.label}
                  </span>
                  <span className="text-num-sm">
                    {name === SOC_SERIES.key
                      ? `${formatNumber(Number(value), 1)} %`
                      : `${formatNumber(Math.abs(Number(value)), 2)} ${unit}`}
                  </span>
                </span>
              )}
            />
          }
        />
        {supplyKeys.map((series) => (
          <Bar
            key={series.key}
            yAxisId="energy"
            dataKey={series.key}
            stackId="supply"
            fill={`var(--color-${series.key})`}
            isAnimationActive={false}
          />
        ))}
        {mode === "power" && withUnmet && (
          <Bar
            yAxisId="energy"
            dataKey={UNMET_SERIES.key}
            stackId="supply"
            fill={`var(--color-${UNMET_SERIES.key})`}
            isAnimationActive={false}
          />
        )}
        {mode === "power" ? (
          <Line
            yAxisId="energy"
            dataKey={DEMAND_SERIES.key}
            type="linear"
            stroke={`var(--color-${DEMAND_SERIES.key})`}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        ) : (
          <Line
            yAxisId="soc"
            dataKey={SOC_SERIES.key}
            type="linear"
            stroke={`var(--color-${SOC_SERIES.key})`}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
};

export default EnergyChart;
