import SectionCard from "@/shared/component/SectionCard";
import { CURRENCY_OPTIONS, ECONOMICS_FIELDS, SIMULATION_STEPS } from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[5];

const EconomicsSection = ({ control, ...fieldProps }: SectionFieldProps) => {
  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {/* Ditampilkan di sini, tetapi dikirim sebagai `project.currency`. */}
        <FormSelectField
          control={control}
          name="project.currency"
          id="currency"
          label="Mata uang"
          options={CURRENCY_OPTIONS}
        />
        <FormNumberField
          name="economics.discount_rate"
          meta={ECONOMICS_FIELDS.discount_rate}
          {...fieldProps}
        />
        <FormNumberField
          name="economics.fuel_price_escalation_annual"
          meta={ECONOMICS_FIELDS.fuel_price_escalation_annual}
          {...fieldProps}
        />
        <FormNumberField
          name="economics.additional_project_cost"
          meta={ECONOMICS_FIELDS.additional_project_cost}
          {...fieldProps}
        />
      </div>
      <FormNote>
        Mengganti mata uang tidak mengonversi angka biaya yang sudah diisi.
        Pastikan semua biaya memakai mata uang yang sama.
      </FormNote>
    </SectionCard>
  );
};

export default EconomicsSection;
