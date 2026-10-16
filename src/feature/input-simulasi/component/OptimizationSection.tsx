import { IconShieldCheck, IconTarget } from "@tabler/icons-react";
import type { ScenarioKey } from "@/repository/simulation/dto";
import SectionCard from "@/shared/component/SectionCard";
import SubPanel from "@/shared/component/SubPanel";
import {
  OBJECTIVE_OPTIONS,
  RELIABILITY_FIELDS,
  SCENARIO_OPTIONS,
  SHORTAGE_POLICY_OPTIONS,
  SIMULATION_STEPS,
} from "../data";
import FormNote from "./FormNote";
import FormNumberField, { type SectionFieldProps } from "./FormNumberField";
import FormSelectField from "./FormSelectField";

const STEP = SIMULATION_STEPS[6];

const SCENARIO_SELECT_OPTIONS = SCENARIO_OPTIONS.map((option) => ({
  label: option.label,
  value: option.id,
}));

type OptimizationSectionProps = SectionFieldProps & {
  shortagePolicy: "forbid" | "bounded";
  selectedScenario: ScenarioKey;
};

const OptimizationSection = ({
  control,
  shortagePolicy,
  selectedScenario,
  ...fieldProps
}: OptimizationSectionProps) => {
  const scenarioDescription = SCENARIO_OPTIONS.find(
    (option) => option.id === selectedScenario,
  )?.description;

  return (
    <SectionCard
      id={STEP.key}
      icon={STEP.icon}
      title={STEP.sectionTitle}
      description={STEP.sectionDescription}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SubPanel icon={IconShieldCheck} title="Keandalan pasokan">
          <FormNumberField
            name="reliability.target_supply_fraction"
            meta={RELIABILITY_FIELDS.target_supply_fraction}
            {...fieldProps}
          />
          <FormSelectField
            control={control}
            name="reliability.shortage_policy"
            id="shortagePolicy"
            label="Kebijakan kekurangan listrik"
            options={SHORTAGE_POLICY_OPTIONS}
            className="flex-none"
          />
          {shortagePolicy === "bounded" && (
            <FormNumberField
              name="reliability.max_unmet_energy_fraction"
              meta={RELIABILITY_FIELDS.max_unmet_energy_fraction}
              {...fieldProps}
            />
          )}
          <FormNumberField
            name="reliability.reserve_margin_fraction"
            meta={RELIABILITY_FIELDS.reserve_margin_fraction}
            {...fieldProps}
          />
        </SubPanel>

        <SubPanel icon={IconTarget} title="Tujuan & skenario">
          <FormSelectField
            control={control}
            name="optimization.objective"
            id="objective"
            label="Tujuan utama optimasi"
            options={OBJECTIVE_OPTIONS}
            className="flex-none"
          />
          <p className="text-fg-tertiary text-small">
            Tujuan selain biaya perlu fungsi objektif yang sesuai di backend.
          </p>

          <FormSelectField
            control={control}
            name="optimization.scenario"
            id="scenario"
            label="Skenario"
            options={SCENARIO_SELECT_OPTIONS}
            className="flex-none"
          />
          {scenarioDescription && (
            <p className="text-fg-tertiary text-small">{scenarioDescription}</p>
          )}
        </SubPanel>
      </div>

      <FormNote>
        Target dan batas di card ini harus diterjemahkan backend menjadi kendala
        matematis; angka di UI tidak dengan sendirinya menjamin model telah
        menegakkannya.
      </FormNote>
    </SectionCard>
  );
};

export default OptimizationSection;
