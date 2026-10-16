import { cn } from "@/lib/utils";

interface MetricValueProps {
  value: string;
  unit: string;
  className?: string;
}

/** Angka KPI + satuan kecil di garis dasar yang sama. */
const MetricValue = ({ value, unit, className }: MetricValueProps) => (
  <p className={cn("flex items-baseline gap-1.5", className)}>
    <span className="text-kpi">{value}</span>
    <span className="text-fg-tertiary text-small">{unit}</span>
  </p>
);

export default MetricValue;
