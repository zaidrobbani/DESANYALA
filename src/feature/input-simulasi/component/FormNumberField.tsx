import {
  type FieldErrors,
  get,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import type {
  SimulationFormValues,
  SimulationSectionKey,
} from "@/schemas/simulation/simulation.schema";
import NumberField, { type FieldSource } from "@/shared/component/NumberField";
import type { NumberFieldMeta } from "../data";

export interface FormNumberFieldProps {
  name: Path<SimulationFormValues> & `${SimulationSectionKey}.${string}`;
  meta: NumberFieldMeta;
  register: UseFormRegister<SimulationFormValues>;
  errors: FieldErrors<SimulationFormValues>;
  sourceFor: (
    path: `${SimulationSectionKey}.${string}`,
    meta: NumberFieldMeta,
  ) => FieldSource;
  helper?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

/** NumberField yang terhubung ke react-hook-form berdasarkan meta di data.ts. */
const FormNumberField = ({
  name,
  meta,
  register,
  errors,
  sourceFor,
  helper,
  inputMode,
}: FormNumberFieldProps) => {
  return (
    <NumberField
      label={meta.label}
      unit={meta.unit}
      helper={helper ?? meta.helper}
      source={sourceFor(name, meta)}
      error={get(errors, name)?.message}
      inputMode={inputMode}
      {...register(name)}
    />
  );
};

export default FormNumberField;
