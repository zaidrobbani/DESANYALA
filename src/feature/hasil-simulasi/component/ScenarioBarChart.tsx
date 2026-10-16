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
import type { ScenarioKey } from "@/repository/simulation/dto";
import { niceAxis } from "@/shared/util/chart";
import { formatNumber } from "@/shared/util/number";
import { SCENARIO_META } from "../data";

const chartConfig = {
  baseline: {
    label: SCENARIO_META.baseline.label,
    color: SCENARIO_META.baseline.color,
  },
  hybrid: {
    label: SCENARIO_META.hybrid.label,
    color: SCENARIO_META.hybrid.color,
  },
} satisfies ChartConfig;

const AXIS_TICK = { fontSize: 12, fontWeight: 500 };

export interface ScenarioBarDatum {
  key: ScenarioKey;
  value: number;
}

interface ScenarioBarChartProps {
  data: ScenarioBarDatum[];
  /** Format label di atas batang. */
  formatValue: (value: number) => string;
  /** Jumlah interval sumbu Y. */
  intervals?: number;
  ariaLabel: string;
  className?: string;
}

/** Grafik batang dua skenario (Figma: Bar Chart) dengan label nilai. */
const ScenarioBarChart = ({
  data,
  formatValue,
  intervals = 4,
  ariaLabel,
  className,
}: ScenarioBarChartProps) => {
  const { top, ticks } = niceAxis(
    Math.max(0, ...data.map((d) => d.value)),
    intervals,
  );
  const rows = data.map((d) => ({
    ...d,
    label: SCENARIO_META[d.key].shortLabel,
  }));

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
          tickFormatter={(value: number) => formatNumber(value)}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={48}
        />
        <Bar
          dataKey="value"
          maxBarSize={72}
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={SCENARIO_META[row.key].color} />
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

export default ScenarioBarChart;
