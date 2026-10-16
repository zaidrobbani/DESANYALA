import { IconCoins, IconGauge, IconRuler2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import { BATTERY_FIELDS, SIMULATION_STEPS } from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSwitch from "./FormSwitch";

const STEP = SIMULATION_STEPS[4];

type BatterySectionProps = SectionFieldProps & {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

const BatterySection = ({
  control,
  enabled,
  onEnabledChange,
  ...fieldProps
}: BatterySectionProps) => {
  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
      action={
        <FormSwitch
          control={control}
          name="battery.enabled"
          id="batteryEnabled"
          label="Gunakan baterai"
          onChange={onEnabledChange}
        />
      }
    >
      {/* Nonaktif = tampil redup dan tidak bisa diisi, nilai tetap disimpan. */}
      <div
        id="batteryFields"
        inert={!enabled}
        aria-disabled={!enabled}
        className={cn(
          "grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3",
          !enabled && "opacity-45",
        )}
      >
        <SubPanel
          icon={IconRuler2}
          iconClassName="text-energy-battery"
          title="Kapasitas"
          description="Batas yang boleh dipilih optimizer"
        >
          <FormNumberField
            name="battery.capacity_min_kwh"
            meta={BATTERY_FIELDS.capacity_min_kwh}
            deps={["battery.capacity_max_kwh"]}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.capacity_max_kwh"
            meta={BATTERY_FIELDS.capacity_max_kwh}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.power_max_kw"
            meta={BATTERY_FIELDS.power_max_kw}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconGauge}
          iconClassName="text-energy-battery"
          title="Efisiensi & SOC"
        >
          <FormNumberField
            name="battery.charge_efficiency"
            meta={BATTERY_FIELDS.charge_efficiency}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.discharge_efficiency"
            meta={BATTERY_FIELDS.discharge_efficiency}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.soc_min_fraction"
            meta={BATTERY_FIELDS.soc_min_fraction}
            deps={["battery.soc_initial_fraction"]}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.soc_max_fraction"
            meta={BATTERY_FIELDS.soc_max_fraction}
            deps={["battery.soc_min_fraction", "battery.soc_initial_fraction"]}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.soc_initial_fraction"
            meta={BATTERY_FIELDS.soc_initial_fraction}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconCoins}
          iconClassName="text-energy-battery"
          title="Biaya & umur"
        >
          <FormNumberField
            name="battery.capex_per_kwh"
            meta={BATTERY_FIELDS.capex_per_kwh}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.power_capex_per_kw"
            meta={BATTERY_FIELDS.power_capex_per_kw}
            {...fieldProps}
          />
          <FormNumberField
            name="battery.lifetime_years"
            meta={BATTERY_FIELDS.lifetime_years}
            inputMode="numeric"
            {...fieldProps}
          />
        </SubPanel>
      </div>

      {!enabled && (
        <FormNote>
          Baterai nonaktif. Payload dikirim dengan{" "}
          <code className="font-mono text-code">battery.enabled = false</code>{" "}
          dan backend harus mematikan komponen baterai di model.
        </FormNote>
      )}
    </SectionCard>
  );
};

export default BatterySection;
