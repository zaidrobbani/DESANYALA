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
import { useIsMobile } from "@/hooks/use-mobile";
import type { HourlyDispatch } from "@/repository/simulation/dto";
import { formatHour, niceAxis } from "@/shared/util/chart";
import { formatNumber } from "@/shared/util/number";
import { DISPATCH_SERIES, LOAD_SERIES } from "../data";

const chartConfig = Object.fromEntries(
  [...DISPATCH_SERIES, LOAD_SERIES].map((series) => [
    series.key,
    { label: series.label, color: series.color },
  ]),
) satisfies ChartConfig;

const AXIS_TICK = { fontSize: 12, fontWeight: 500 };

interface DispatchChartProps {
  dispatch: HourlyDispatch[];
  ariaLabel: string;
}

/**
 * Daya per jam hari tipikal (Figma: Stacked Dispatch Chart). Pasokan
 * ditumpuk di atas nol, pengisian baterai digambar di bawah nol.
 */
const DispatchChart = ({ dispatch, ariaLabel }: DispatchChartProps) => {
  // Label jam tiap 3 jam (desktop) atau 6 jam (mobile) agar tidak bertumpuk.
  const hourInterval = useIsMobile() ? 5 : 2;
  const rows = dispatch.map((row) => ({
    hour: row.hour,
    diesel: row.diesel_kw,
    pv: row.pv_kw,
    discharge: row.battery_discharge_kw,
    charge: -row.battery_charge_kw,
    load: row.load_kw,
  }));

  const maxSupply = Math.max(
    0,
    ...rows.map((r) => Math.max(r.load, r.diesel + r.pv + r.discharge)),
  );
  const maxCharge = Math.max(0, ...rows.map((r) => -r.charge));
  const { top, step, ticks } = niceAxis(maxSupply);
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
      className="aspect-auto h-[250px] w-full"
    >
      <ComposedChart
        data={rows}
        stackOffset="sign"
        barCategoryGap="35%"
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--bg-muted)" />
        <XAxis
          dataKey="hour"
          interval={hourInterval}
          tickFormatter={formatHour}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          tickMargin={8}
        />
        <YAxis
          domain={[bottom, top]}
          ticks={[...negativeTicks, ...ticks]}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={36}
        />
        <ReferenceLine y={0} stroke="var(--border-strong)" />
        <ChartTooltip
          cursor={{ fill: "var(--bg-subtle)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                formatHour(Number(payload?.[0]?.payload?.hour ?? 0))
              }
              formatter={(value, name) => (
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="text-fg-secondary">
                    {chartConfig[name as keyof typeof chartConfig]?.label}
                  </span>
                  <span className="text-num-sm">
                    {formatNumber(Math.abs(Number(value)), 1)} kW
                  </span>
                </span>
              )}
            />
          }
        />
        {DISPATCH_SERIES.map((series) => (
          <Bar
            key={series.key}
            dataKey={series.key}
            stackId="supply"
            fill={`var(--color-${series.key})`}
            isAnimationActive={false}
          />
        ))}
        <Line
          dataKey={LOAD_SERIES.key}
          type="linear"
          stroke={`var(--color-${LOAD_SERIES.key})`}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ChartContainer>
  );
};

export default DispatchChart;
