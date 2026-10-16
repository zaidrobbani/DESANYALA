import { IconCoins, IconRuler2, IconSun } from "@tabler/icons-react";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import TextField from "@/shared/component/TextField";
import { PV_CAPACITY_MODE_OPTIONS, PV_FIELDS, SIMULATION_STEPS } from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";
import FormSwitch from "./FormSwitch";

const STEP = SIMULATION_STEPS[2];

type PvSectionProps = SectionFieldProps & {
  enabled: boolean;
  capacityMode: "optimize" | "fixed";
  onEnabledChange: (enabled: boolean) => void;
};

const PvSection = ({
  control,
  enabled,
  capacityMode,
  onEnabledChange,
  ...fieldProps
}: PvSectionProps) => {
  const { register, errors } = fieldProps;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
      action={
        <FormSwitch
          control={control}
          name="pv.enabled"
          id="pvEnabled"
          label="Gunakan panel surya"
          onChange={onEnabledChange}
        />
      }
    >
      {enabled ? (
        <div
          id="pvFields"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <SubPanel
            icon={IconSun}
            iconClassName="text-energy-pv-ink"
            title="Sumber daya surya"
          >
            <TextField
              id="solarLocation"
              label="Lokasi estimasi sumber daya surya"
              placeholder="Kosong = pakai lokasi proyek"
              error={errors.pv?.resource_location?.message}
              className="flex-none"
              {...register("pv.resource_location")}
            />
            <FormNumberField
              name="pv.peak_sun_hours_estimate"
              meta={PV_FIELDS.peak_sun_hours_estimate}
              {...fieldProps}
            />
            <FormNumberField
              name="pv.system_performance_factor"
              meta={PV_FIELDS.system_performance_factor}
              {...fieldProps}
            />
            <FormNote>
              Lokasi dan jam matahari belum menghasilkan profil produksi per
              jam; backend perlu data sumber daya surya yang dapat ditelusuri.
            </FormNote>
          </SubPanel>

          <SubPanel
            icon={IconRuler2}
            iconClassName="text-energy-pv-ink"
            title="Kapasitas"
            description="Batas yang boleh dipilih optimizer"
          >
            <FormSelectField
              control={control}
              name="pv.capacity_mode"
              id="pvMode"
              label="Penentuan kapasitas"
              options={PV_CAPACITY_MODE_OPTIONS}
              className="flex-none"
            />
            {capacityMode === "fixed" && (
              <FormNumberField
                name="pv.fixed_capacity_kwp"
                meta={PV_FIELDS.fixed_capacity_kwp}
                {...fieldProps}
              />
            )}
            <FormNumberField
              name="pv.capacity_min_kwp"
              meta={PV_FIELDS.capacity_min_kwp}
              deps={["pv.capacity_max_kwp"]}
              {...fieldProps}
            />
            <FormNumberField
              name="pv.capacity_max_kwp"
              meta={PV_FIELDS.capacity_max_kwp}
              {...fieldProps}
            />
          </SubPanel>

          <SubPanel
            icon={IconCoins}
            iconClassName="text-energy-pv-ink"
            title="Biaya & umur"
          >
            <FormNumberField
              name="pv.capex_per_kwp"
              meta={PV_FIELDS.capex_per_kwp}
              {...fieldProps}
            />
            <FormNumberField
              name="pv.opex_annual_per_kwp"
              meta={PV_FIELDS.opex_annual_per_kwp}
              {...fieldProps}
            />
            <FormNumberField
              name="pv.lifetime_years"
              meta={PV_FIELDS.lifetime_years}
              inputMode="numeric"
              {...fieldProps}
            />
          </SubPanel>
        </div>
      ) : (
        <FormNote>
          Panel surya nonaktif. Payload tetap dikirim dengan{" "}
          <code className="font-mono text-code">pv.enabled = false</code>, jadi
          nonaktifkan juga skenario dengan PV di bagian 7.
        </FormNote>
      )}
    </SectionCard>
  );
};

export default PvSection;
