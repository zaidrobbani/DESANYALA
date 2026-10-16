import { IconCheck, IconClipboardList } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/shared/util/number";
import type { InputSimulasiController } from "../hooks/useInputSimulasiContainer";

interface SummaryLineProps {
  id: string;
  label: string;
  value: string;
  valueClassName?: string;
}

const SummaryLine = ({
  id,
  label,
  value,
  valueClassName,
}: SummaryLineProps) => (
  <div className="flex items-center justify-between gap-3 border-line border-b py-2 last:border-b-0">
    <dt className="text-body text-fg-secondary">{label}</dt>
    <dd
      id={id}
      className={cn(
        "text-right text-body-strong text-fg-primary",
        valueClassName,
      )}
    >
      {value}
    </dd>
  </div>
);

const activeLabel = (active: boolean) => (active ? "Aktif" : "Nonaktif");

interface ConfigSummaryPanelProps {
  summary: InputSimulasiController["summary"];
  /** Prefix id elemen; panel dirender dua kali (sidebar & mobile). */
  idPrefix?: string;
  className?: string;
}

/** Ringkasan konfigurasi sebelum dikirim ke backend (sidebar HTML referensi). */
const ConfigSummaryPanel = ({
  summary,
  idPrefix = "",
  className,
}: ConfigSummaryPanelProps) => {
  const titleId = `${idPrefix}ringkasan-konfigurasi-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex flex-col gap-2 rounded-lg bg-surface p-4", className)}
    >
      <div className="flex items-center gap-2">
        <IconClipboardList
          aria-hidden
          className="size-5 shrink-0 text-brand"
          stroke={1.75}
        />
        <h2 id={titleId} className="text-body-strong">
          Ringkasan konfigurasi
        </h2>
      </div>

      <dl>
        <SummaryLine
          id={`${idPrefix}equipmentCount`}
          label="Peralatan tercatat"
          value={`${summary.equipmentCount} item`}
        />
        <SummaryLine
          id={`${idPrefix}sideDaily`}
          label="Energi harian"
          value={`${formatNumber(summary.dailyEnergyKwh, 2, 2)} kWh`}
        />
        <SummaryLine
          id={`${idPrefix}sideGen`}
          label="Total genset nominal"
          value={`${formatNumber(summary.totalGeneratorKw, 1)} kW`}
        />
        <SummaryLine
          id={`${idPrefix}sidePv`}
          label="PV"
          value={activeLabel(summary.pvEnabled)}
          valueClassName={
            summary.pvEnabled ? "text-success" : "text-fg-tertiary"
          }
        />
        <SummaryLine
          id={`${idPrefix}sideBattery`}
          label="Baterai"
          value={activeLabel(summary.batteryEnabled)}
          valueClassName={
            summary.batteryEnabled ? "text-success" : "text-fg-tertiary"
          }
        />
      </dl>

      <div className="flex flex-col gap-1.5 pt-1">
        <p className="text-fg-primary text-label">Skenario terpilih</p>
        {summary.scenarios.length > 0 ? (
          <ul id={`${idPrefix}scenarioSummary`} className="flex flex-col gap-1">
            {summary.scenarios.map((scenario) => (
              <li
                key={scenario.id}
                className="flex items-center gap-2 text-body text-fg-primary"
              >
                <IconCheck
                  aria-hidden
                  className="size-4 shrink-0 text-success"
                  stroke={1.75}
                />
                {scenario.label}
              </li>
            ))}
          </ul>
        ) : (
          <p
            id={`${idPrefix}scenarioSummary`}
            className="text-danger text-small"
          >
            Pilih minimal satu skenario.
          </p>
        )}
      </div>
    </section>
  );
};

export default ConfigSummaryPanel;
