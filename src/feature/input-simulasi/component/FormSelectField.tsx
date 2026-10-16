import { type Control, Controller, get } from "react-hook-form";
import type { SimulationFormValues } from "@/schemas/simulation/simulation.schema";
import SelectField, { type SelectOption } from "@/shared/component/SelectField";
import type { FormFieldPath } from "./FormNumberField";

interface FormSelectFieldProps {
  control: Control<SimulationFormValues>;
  name: FormFieldPath;
  /** HTML ID di desanyala_input_cards.html. */
  id: string;
  label: string;
  options: readonly SelectOption[];
  className?: string;
}

/** SelectField yang terhubung ke react-hook-form. */
const FormSelectField = ({
  control,
  name,
  id,
  label,
  options,
  className,
}: FormSelectFieldProps) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, formState }) => (
        <SelectField
          id={id}
          label={label}
          value={String(field.value)}
          options={options}
          onValueChange={field.onChange}
          error={get(formState.errors, name)?.message}
          className={className}
        />
      )}
    />
  );
};

export default FormSelectField;
