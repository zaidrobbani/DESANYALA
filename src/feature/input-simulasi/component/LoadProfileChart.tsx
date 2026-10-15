"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { toHourlyChartData } from "@/shared/util/load-profile";
import { formatNumber } from "@/shared/util/number";

const chartConfig = {
  load: { label: "Beban", color: "var(--energy-load)" },
} satisfies ChartConfig;

const X_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

/** Batas atas sumbu Y yang "bulat" + 4 interval yang rapi. */
const niceAxis = (max: number) => {
  const raw = Math.max(max, 1) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step || step;
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  return { top, ticks };
};

interface LoadProfileChartProps {
  title: string;
  profileKw: number[] | null;
  emptyMessage?: string;
}

const LoadProfileChart = ({
  title,
  profileKw,
  emptyMessage = "Isi total energi dan daya puncak untuk melihat profil.",
}: LoadProfileChartProps) => {
  const data = profileKw ? toHourlyChartData(profileKw) : [];
  const { top, ticks } = niceAxis(Math.max(0, ...(profileKw ?? [0])));

  return (
    <figure className="flex flex-col gap-5">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-body-strong">{title}</span>
        <span className="flex items-center gap-1.5 text-fg-secondary text-small">
          <span aria-hidden className="h-0.5 w-3.5 bg-energy-load" />
          Beban (kW)
        </span>
      </figcaption>

      {profileKw ? (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] w-full"
        >
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke="var(--bg-muted)" />
            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 23]}
              ticks={X_TICKS}
              tickFormatter={(hour: number) =>
                `${String(hour).padStart(2, "0")}:00`
              }
              tickLine={false}
              axisLine={{ stroke: "var(--border-strong)" }}
              tick={{ fontSize: 12, fontWeight: 500 }}
              tickMargin={6}
            />
            <YAxis
              domain={[0, top]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fontWeight: 500 }}
              width={44}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border-strong)" }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ?? ""
                  }
                  formatter={(value) => (
                    <span className="text-num-sm">
                      {formatNumber(Number(value))} kW
                    </span>
                  )}
                />
              }
            />
            <Line
              dataKey="load"
              type="linear"
              stroke="var(--color-load)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-lg bg-subtle px-4 text-center text-fg-tertiary text-small">
          {emptyMessage}
        </div>
      )}
    </figure>
  );
};

export default LoadProfileChart;
