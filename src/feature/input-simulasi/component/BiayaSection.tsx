import {
  IconArrowsSplit2,
  IconGasStation,
  IconReceipt,
} from "@tabler/icons-react";
import { type Control, Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import { BIAYA_FIELDS, SCENARIO_OPTIONS, SIMULATION_STEPS } from "../data";
import FormNumberField, { type FormNumberFieldProps } from "./FormNumberField";

const STEP = SIMULATION_STEPS[3];

type CapexKey = "capex_pv" | "capex_baterai" | "capex_inverter";

type BiayaSectionProps = Pick<
  FormNumberFieldProps,
  "register" | "errors" | "sourceFor"
> & {
  control: Control<SimulationFormValues>;
  usdHelpers: Record<CapexKey, (template: string) => string>;
};

const BiayaSection = ({
  control,
  usdHelpers,
  ...fieldProps
}: BiayaSectionProps) => {
  const scenarioError = fieldProps.errors.biaya?.skenario_hybrid?.message;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SubPanel
          icon={IconReceipt}
          title="Harga komponen"
          description="Terpasang, termasuk transport"
        >
          {(["capex_pv", "capex_baterai", "capex_inverter"] as const).map(
            (key) => (
              <FormNumberField
                key={key}
                name={`biaya.${key}`}
                meta={BIAYA_FIELDS[key]}
                helper={usdHelpers[key](BIAYA_FIELDS[key].helper)}
                {...fieldProps}
              />
            ),
          )}
        </SubPanel>

        <SubPanel icon={IconGasStation} title="Bahan bakar & ekonomi">
          <FormNumberField
            name="biaya.harga_solar"
            meta={BIAYA_FIELDS.harga_solar}
            {...fieldProps}
          />
          <FormNumberField
            name="biaya.umur_proyek"
            meta={BIAYA_FIELDS.umur_proyek}
            inputMode="numeric"
            {...fieldProps}
          />
          <FormNumberField
            name="biaya.diskonto"
            meta={BIAYA_FIELDS.diskonto}
            {...fieldProps}
          />
          <FormNumberField
            name="biaya.kurs"
            meta={BIAYA_FIELDS.kurs}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel
          icon={IconArrowsSplit2}
          title="Skenario & keandalan"
          description="Dibandingkan pada beban yang sama"
        >
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Skenario yang dijalankan</legend>
            {SCENARIO_OPTIONS.map((option) => (
              <Controller
                key={option.key}
                control={control}
                name={`biaya.${option.key}`}
                render={({ field }) => (
                  <label
                    htmlFor={`biaya-${option.key}`}
                    className="flex cursor-pointer items-center gap-2.5 text-body text-fg-primary"
                  >
                    <Checkbox
                      id={`biaya-${option.key}`}
                      ref={field.ref}
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      onBlur={field.onBlur}
                      className="size-[18px] rounded-sm border-line-strong"
                    />
                    {option.label}
                  </label>
                )}
              />
            ))}
            {scenarioError && (
              <p className="text-danger text-small">{scenarioError}</p>
            )}
          </fieldset>
          <FormNumberField
            name="biaya.batas_unserved"
            meta={BIAYA_FIELDS.batas_unserved}
            {...fieldProps}
          />
          <p className="text-fg-tertiary text-small">
            Skenario diesel + PV tanpa baterai tidak tersedia di MVP.
          </p>
        </SubPanel>
      </div>
    </SectionCard>
  );
};

export default BiayaSection;
