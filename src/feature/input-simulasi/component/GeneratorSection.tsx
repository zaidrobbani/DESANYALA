import { IconCoins, IconGasStation, IconSettings } from "@tabler/icons-react";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import {
  FUEL_MODEL_OPTIONS,
  GENERATOR_FIELDS,
  GENERATOR_MODE_OPTIONS,
  SIMULATION_STEPS,
} from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[3];

type GeneratorSectionProps = SectionFieldProps & {
  fuelModel: "default" | "efficiency" | "curve";
};

const GeneratorSection = ({
  control,
  fuelModel,
  ...fieldProps
}: GeneratorSectionProps) => {
  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SubPanel
          icon={IconSettings}
          iconClassName="text-energy-diesel"
          title="Unit & operasi"
        >
          <FormSelectField
            control={control}
            name="generators.mode"
            id="genMode"
            label="Konfigurasi genset"
            options={GENERATOR_MODE_OPTIONS}
            className="flex-none"
          />
          <FormNumberField
            name="generators.unit_count"
            meta={GENERATOR_FIELDS.unit_count}
            inputMode="numeric"
            {...fieldProps}
          />
          <FormNumberField
            name="generators.rated_power_each_kw"
            meta={GENERATOR_FIELDS.rated_power_each_kw}
            {...fieldProps}
          />
          <FormNumberField
            name="generators.min_loading_fraction"
            meta={GENERATOR_FIELDS.min_loading_fraction}
            {...fieldProps}
          />
          <FormNumberField
            name="generators.max_loading_fraction"
            meta={GENERATOR_FIELDS.max_loading_fraction}
            deps={["generators.min_loading_fraction"]}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconGasStation}
          iconClassName="text-energy-diesel"
          title="Bahan bakar"
        >
          <FormNumberField
            name="generators.fuel_price_per_liter"
            meta={GENERATOR_FIELDS.fuel_price_per_liter}
            {...fieldProps}
          />
          <FormSelectField
            control={control}
            name="generators.fuel_model"
            id="fuelCurve"
            label="Data konsumsi bahan bakar"
            options={FUEL_MODEL_OPTIONS}
            className="flex-none"
          />
          {fuelModel === "curve" ? (
            <FormNote tone="warning">
              Unggah kurva konsumsi belum tersedia. Pilihan ini baru penanda
              untuk backend, belum ada file kurva yang dikirim.
            </FormNote>
          ) : (
            <FormNumberField
              name="generators.efficiency_fraction"
              meta={GENERATOR_FIELDS.efficiency_fraction}
              {...fieldProps}
            />
          )}
        </SubPanel>

        <SubPanel
          icon={IconCoins}
          iconClassName="text-energy-diesel"
          title="Biaya & umur"
        >
          <FormNumberField
            name="generators.capex_per_kw"
            meta={GENERATOR_FIELDS.capex_per_kw}
            {...fieldProps}
          />
          <FormNumberField
            name="generators.opex_annual_per_unit"
            meta={GENERATOR_FIELDS.opex_annual_per_unit}
            {...fieldProps}
          />
          <FormNumberField
            name="generators.lifetime_years"
            meta={GENERATOR_FIELDS.lifetime_years}
            inputMode="numeric"
            {...fieldProps}
          />
        </SubPanel>
      </div>

      <FormNote tone="warning">
        Jumlah unit × kapasitas per unit belum berarti optimizer mengatur
        hidup/mati setiap genset. Model multi-unit perlu merepresentasikan tiap
        unit dan kendala operasinya secara eksplisit.
      </FormNote>
    </SectionCard>
  );
};

export default GeneratorSection;
