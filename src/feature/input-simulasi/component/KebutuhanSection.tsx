import { IconFileSpreadsheet, IconUpload, IconX } from "@tabler/icons-react";
import { useRef } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { LoadProfilePreset } from "@/repository/simulation/dto";
import {
  LOAD_PROFILE_ACCEPT,
  type SimulationFormValues,
} from "@/schemas/simulation/simulation.schema";
import NumberField, { type FieldSource } from "@/shared/component/NumberField";
import SectionCard from "@/shared/component/SectionCard";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from "@/shared/component/SegmentedTabs";
import SourceBadge from "@/shared/component/SourceBadge";
import { formatNumber } from "@/shared/util/number";
import {
  KEBUTUHAN_FIELDS,
  LOAD_PROFILE_COLUMNS,
  LOAD_PROFILE_FORMAT_NOTE,
  type NumberFieldMeta,
  SIMULATION_STEPS,
} from "../data";
import LoadProfileChart from "./LoadProfileChart";

const STEP = SIMULATION_STEPS[1];

/* ------------------------------------------------------------------------ */

interface PresetOptionsProps {
  presets: LoadProfilePreset[];
  value: string;
  onChange: (presetId: string) => void;
  error?: string;
}

const PresetOptions = ({
  presets,
  value,
  onChange,
  error,
}: PresetOptionsProps) => (
  <div className="flex flex-col gap-1.5">
    <RadioGroup
      value={value}
      onValueChange={onChange}
      aria-label="Profil beban contoh"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {presets.map((preset) => (
        <label
          key={preset.id}
          htmlFor={`preset-${preset.id}`}
          className={cn(
            "flex cursor-pointer gap-3 rounded-lg px-4 py-3.5 transition-colors",
            preset.id === value
              ? "border-[1.5px] border-brand"
              : "border border-line hover:border-line-strong",
          )}
        >
          <RadioGroupItem
            id={`preset-${preset.id}`}
            value={preset.id}
            className="mt-[3px] border-[1.5px] border-line-strong"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-strong">{preset.name}</span>
            <span className="text-fg-secondary text-small">
              {preset.description}
            </span>
            <SourceBadge tone={preset.source.tone}>
              {preset.source.label}
            </SourceBadge>
          </span>
        </label>
      ))}
    </RadioGroup>
    {error && <p className="text-danger text-small">{error}</p>}
  </div>
);

/* ------------------------------------------------------------------------ */

interface StatProps {
  label: string;
  value: number;
  unit: string;
  source: LoadProfilePreset["stats_source"];
  className?: string;
}

const Stat = ({ label, value, unit, source, className }: StatProps) => (
  <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}>
    <dt className="text-fg-secondary text-small">{label}</dt>
    <dd className="flex items-baseline gap-1.5">
      <span className="text-kpi">{formatNumber(value, 2, 2)}</span>
      <span className="text-fg-tertiary text-small">{unit}</span>
    </dd>
    <dd>
      <SourceBadge tone={source.tone}>{source.label}</SourceBadge>
    </dd>
  </div>
);

const PresetStats = ({ preset }: { preset: LoadProfilePreset }) => (
  <dl className="grid grid-cols-1 gap-4 sm:flex sm:gap-0">
    <Stat
      label="Energi harian"
      value={preset.daily_energy_kwh}
      unit="kWh/hari"
      source={preset.stats_source}
      className="sm:pr-5"
    />
    <Stat
      label="Beban puncak"
      value={preset.peak_load_kw}
      unit="kW"
      source={preset.stats_source}
      className="sm:border-line sm:border-l sm:px-5"
    />
    <Stat
      label="Radiasi rata-rata"
      value={preset.avg_irradiance_kwh_m2_day}
      unit="kWh/m²/hari"
      source={preset.stats_source}
      className="sm:border-line sm:border-l sm:px-5"
    />
  </dl>
);

/* ------------------------------------------------------------------------ */

interface UploadPanelProps {
  file: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
}

const UploadPanel = ({ file, error, onFileChange }: UploadPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex w-full flex-col items-start gap-2 rounded-lg bg-subtle p-4 lg:w-[360px] lg:shrink-0">
      <p className="text-body-strong">Profil beban per jam (opsional)</p>
      <input
        ref={inputRef}
        type="file"
        accept={LOAD_PROFILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          onFileChange(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      {file ? (
        <div className="flex w-full items-center gap-2 rounded-md border border-line-strong bg-surface px-3 py-2">
          <IconFileSpreadsheet
            aria-hidden
            className="size-4 shrink-0 text-brand"
            stroke={1.75}
          />
          <span className="min-w-0 flex-1 truncate text-body">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus file ${file.name}`}
            onClick={() => onFileChange(null)}
          >
            <IconX aria-hidden className="size-4" stroke={1.75} />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary"
        >
          <IconUpload aria-hidden className="size-4" stroke={1.75} />
          Unggah file
        </Button>
      )}
      {error && <p className="text-danger text-small">{error}</p>}
      <p className="font-mono text-code text-fg-secondary">
        {LOAD_PROFILE_COLUMNS}
      </p>
      <p className="text-fg-tertiary text-small">{LOAD_PROFILE_FORMAT_NOTE}</p>
    </div>
  );
};

/* ------------------------------------------------------------------------ */

interface KebutuhanSectionProps {
  register: UseFormRegister<SimulationFormValues>;
  errors: FieldErrors<SimulationFormValues>["kebutuhan"];
  kebutuhan: SimulationFormValues["kebutuhan"];
  presets: LoadProfilePreset[];
  selectedPreset: LoadProfilePreset | undefined;
  isPresetsLoading: boolean;
  presetsError: Error | null;
  onRetryPresets: () => void;
  chartProfile: number[] | null;
  sourceFor: (
    path: `kebutuhan.${string}`,
    meta: NumberFieldMeta,
  ) => FieldSource;
  onModeChange: (mode: string) => void;
  onPresetChange: (presetId: string) => void;
  onFileChange: (file: File | null) => void;
}

const KebutuhanSection = ({
  register,
  errors,
  kebutuhan,
  presets,
  selectedPreset,
  isPresetsLoading,
  presetsError,
  onRetryPresets,
  chartProfile,
  sourceFor,
  onModeChange,
  onPresetChange,
  onFileChange,
}: KebutuhanSectionProps) => {
  const isManual = kebutuhan.mode === "manual";

  return (
    <Tabs
      value={kebutuhan.mode}
      onValueChange={onModeChange}
      className="w-full"
    >
      <SectionCard
        id={STEP.key}
        icon={STEP.icon}
        title={STEP.sectionTitle}
        description={STEP.sectionDescription}
        action={
          <SegmentedTabsList aria-label="Sumber data kebutuhan energi">
            <SegmentedTabsTrigger value="contoh">
              Gunakan contoh
            </SegmentedTabsTrigger>
            <SegmentedTabsTrigger value="manual">
              Input manual
            </SegmentedTabsTrigger>
          </SegmentedTabsList>
        }
      >
        <div className="flex flex-col gap-5">
          <TabsContent value="contoh" className="mt-0 flex flex-col gap-5">
            {isPresetsLoading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Skeleton className="h-[104px] bg-subtle" />
                <Skeleton className="h-[104px] bg-subtle" />
              </div>
            )}
            {presetsError && (
              <div className="flex flex-wrap items-center gap-3 text-danger text-small">
                Gagal memuat profil contoh: {presetsError.message}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRetryPresets}
                >
                  Coba lagi
                </Button>
              </div>
            )}
            {presets.length > 0 && (
              <PresetOptions
                presets={presets}
                value={kebutuhan.preset_id}
                onChange={onPresetChange}
                error={errors?.preset_id?.message}
              />
            )}
            {selectedPreset && <PresetStats preset={selectedPreset} />}
          </TabsContent>

          <TabsContent
            value="manual"
            className="mt-0 flex flex-col gap-4 lg:flex-row"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-4 sm:flex-row">
                <NumberField
                  className="flex-1"
                  label={KEBUTUHAN_FIELDS.energi_harian.label}
                  unit={KEBUTUHAN_FIELDS.energi_harian.unit}
                  helper={KEBUTUHAN_FIELDS.energi_harian.helper}
                  source={sourceFor(
                    "kebutuhan.energi_harian",
                    KEBUTUHAN_FIELDS.energi_harian,
                  )}
                  error={errors?.energi_harian?.message}
                  {...register("kebutuhan.energi_harian")}
                />
                <NumberField
                  className="flex-1"
                  label={KEBUTUHAN_FIELDS.daya_puncak.label}
                  unit={KEBUTUHAN_FIELDS.daya_puncak.unit}
                  helper={KEBUTUHAN_FIELDS.daya_puncak.helper}
                  source={sourceFor(
                    "kebutuhan.daya_puncak",
                    KEBUTUHAN_FIELDS.daya_puncak,
                  )}
                  error={errors?.daya_puncak?.message}
                  {...register("kebutuhan.daya_puncak")}
                />
              </div>
              <p className="text-fg-tertiary text-small">
                Tanpa file, profil 24 jam dibuat dengan menskalakan bentuk
                profil contoh ke total energi dan daya puncak di atas.
              </p>
            </div>
            <UploadPanel
              file={kebutuhan.profil_file}
              error={errors?.profil_file?.message}
              onFileChange={onFileChange}
            />
          </TabsContent>

          <LoadProfileChart
            title={
              isManual
                ? kebutuhan.profil_file
                  ? "Profil dari file (rata-rata per jam, kW)"
                  : "Profil hasil penskalaan (ilustrasi, kW)"
                : "Profil beban harian tipikal (kW)"
            }
            profileKw={chartProfile}
          />
        </div>
      </SectionCard>
    </Tabs>
  );
};

export default KebutuhanSection;
