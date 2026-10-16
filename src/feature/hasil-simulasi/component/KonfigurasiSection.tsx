import { IconLayoutGrid } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ComponentResult } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import { formatNumber } from "@/shared/util/number";
import { COMPONENT_META, COMPONENT_ORDER } from "../data";
import { formatCapacity } from "../util/summarize-result";
import MetricValue from "./MetricValue";

interface KonfigurasiSectionProps {
  components: ComponentResult[];
}

const KonfigurasiSection = ({ components }: KonfigurasiSectionProps) => {
  const ordered = COMPONENT_ORDER.flatMap(
    (key) => components.find((component) => component.key === key) ?? [],
  );

  return (
    <SectionCard
      icon={IconLayoutGrid}
      title="1. Konfigurasi optimal"
      description="Kapasitas yang dipilih optimizer untuk skenario hybrid."
    >
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ordered.map((component) => {
          const meta = COMPONENT_META[component.key];
          return (
            <li
              key={component.key}
              className="flex min-w-0 flex-col gap-2 rounded-lg bg-subtle p-4"
            >
              <span className="flex items-center gap-2">
                <meta.icon
                  aria-hidden
                  className={cn("size-5 shrink-0", meta.iconClass)}
                  stroke={1.75}
                />
                <span className="truncate text-body-strong">{meta.label}</span>
              </span>
              <MetricValue
                value={formatCapacity(component, (v) => formatNumber(v, 1))}
                unit={component.unit}
                className="gap-1"
              />
              <span className="text-fg-tertiary text-small">
                {component.is_existing ? "eksisting, tetap" : "dipasang baru"}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};

export default KonfigurasiSection;
