import { cn } from "@/lib/utils";
import { SCENARIO_META, SCENARIO_ORDER } from "../data";

/** Legenda warna skenario untuk grafik perbandingan. */
const ScenarioLegend = ({ className }: { className?: string }) => (
  <ul className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
    {SCENARIO_ORDER.map((key) => (
      <li
        key={key}
        className="flex items-center gap-1.5 text-fg-secondary text-small"
      >
        <span
          aria-hidden
          className={cn(
            "size-2.5 rounded-[2px]",
            SCENARIO_META[key].swatchClass,
          )}
        />
        {SCENARIO_META[key].label}
      </li>
    ))}
  </ul>
);

export default ScenarioLegend;
