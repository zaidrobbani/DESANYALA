"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { niceAxis } from "@/shared/util/chart";
import { formatCompact } from "@/shared/util/number";

const AXIS_TICK = { fontSize: 12, fontWeight: 500 };

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface ValueBarChartProps {
  data: BarDatum[];
  /** Format label di atas batang. */
  formatValue: (value: number) => string;
  /** Jumlah interval sumbu Y. */
  intervals?: number;
  ariaLabel: string;
  className?: string;
}

/** Grafik batang sederhana (Figma: Bar Chart) dengan label nilai. */
const ValueBarChart = ({
  data,
  formatValue,
  intervals = 4,
  ariaLabel,
  className,
}: ValueBarChartProps) => {
  const { top, ticks } = niceAxis(
    Math.max(0, ...data.map((d) => d.value)),
    intervals,
  );
  const rows = data;
  const chartConfig = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer
      config={chartConfig}
      role="img"
      aria-label={ariaLabel}
      className={cn("aspect-auto h-[200px] w-full", className)}
    >
      <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--bg-muted)" />
        <XAxis
          dataKey="label"
          interval={0}
          tickLine={false}
          axisLine={{ stroke: "var(--border-strong)" }}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          tickMargin={6}
        />
        <YAxis
          domain={[0, top]}
          ticks={ticks}
          tickFormatter={(value: number) => formatCompact(value)}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
        />
        <Bar
          dataKey="value"
          maxBarSize={72}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            offset={6}
            formatter={(value) => formatValue(Number(value))}
            fill="var(--text-primary)"
            fontSize={12}
            fontWeight={500}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};

export default ValueBarChart;
