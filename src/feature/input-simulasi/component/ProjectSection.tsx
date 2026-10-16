import SectionCard from "@/shared/component/SectionCard";
import TextField from "@/shared/component/TextField";
import {
  ELECTRIFICATION_OPTIONS,
  PROJECT_FIELDS,
  SIMULATION_DAYS_OPTIONS,
  SIMULATION_STEPS,
} from "../data";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[0];

const ProjectSection = ({ control, ...fieldProps }: SectionFieldProps) => {
  const { register, errors } = fieldProps;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextField
          id="projectName"
          label="Nama proyek *"
          placeholder="Contoh: Desa Sukamaju"
          error={errors.project?.name?.message}
          {...register("project.name")}
        />
        <TextField
          id="location"
          label="Lokasi administratif *"
          placeholder="Kecamatan, kabupaten, provinsi"
          error={errors.project?.location?.message}
          {...register("project.location")}
        />
        <FormSelectField
          control={control}
          name="project.electrification_status"
          id="electrification"
          label="Kondisi elektrifikasi"
          options={ELECTRIFICATION_OPTIONS}
        />
        <FormNumberField
          name="project.households"
          meta={PROJECT_FIELDS.households}
          inputMode="numeric"
          {...fieldProps}
        />
        <FormSelectField
          control={control}
          name="project.simulation_days"
          id="simulationDays"
          label="Periode simulasi"
          options={SIMULATION_DAYS_OPTIONS}
        />
        <FormNumberField
          name="project.project_lifetime_years"
          meta={PROJECT_FIELDS.project_lifetime_years}
          inputMode="numeric"
          {...fieldProps}
        />
      </div>
    </SectionCard>
  );
};

export default ProjectSection;
