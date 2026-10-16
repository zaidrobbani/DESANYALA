import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  type FieldErrors,
  get,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import { useCreateSimulation } from "@/repository/simulation/query";
import {
  type SimulationFormValues,
  simulationFormSchema,
} from "@/schemas/simulation/simulation.schema";
import type { FieldSource } from "@/shared/component/NumberField";
import { ROUTES } from "@/shared/constant/routes";
import { parseIdNumber } from "@/shared/util/number";
import type { FormFieldPath } from "../component/FormNumberField";
import {
  NEW_LOAD,
  type NumberFieldMeta,
  SCENARIO_OPTIONS,
  SIMULATION_FORM_DEFAULTS,
  SIMULATION_STEPS,
  type SimulationStepKey,
  SOURCE,
} from "../data";
import {
  toDemandLoad,
  toSimulationRequest,
} from "../util/to-simulation-request";
import { useActiveSection } from "./useActiveSection";

export type StepState = "done" | "active" | "default";

const STEP_KEYS = SIMULATION_STEPS.map((step) => step.key);

const firstErrorStep = (errors: FieldErrors<SimulationFormValues>) =>
  SIMULATION_STEPS.find((step) =>
    step.sections.some((section) => Boolean(errors[section])),
  );

const toNumber = (raw: string | undefined) => {
  const value = parseIdNumber(raw ?? "");
  return Number.isFinite(value) ? value : 0;
};

export const useInputSimulasiContainer = () => {
  const router = useRouter();

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: SIMULATION_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    clearErrors,
  } = form;
  const { errors, isSubmitted } = useFormState({ control });

  // Semua nilai form. Dipakai untuk badge sumber & ringkasan: objek baru
  // setiap ada perubahan, jadi aman dengan memoisasi React Compiler
  // (berbeda dengan `dirtyFields` RHF yang dimutasi di tempat).
  const watchedValues = useWatch({ control });
  const currency = watchedValues.project?.currency ?? "IDR";
  const pvEnabled = watchedValues.pv?.enabled ?? false;
  const batteryEnabled = watchedValues.battery?.enabled ?? false;
  const selectedScenarios = watchedValues.optimization?.scenarios ?? [];

  /* --- Daftar peralatan (card 02) ------------------------------------- */
  const loadsArray = useFieldArray({ control, name: "demand.loads" });

  const loads = (watchedValues.demand?.loads ?? []).map((load) =>
    toDemandLoad({
      category: load?.category ?? NEW_LOAD.category,
      device: load?.device ?? "",
      quantity: load?.quantity ?? "",
      power_w: load?.power_w ?? "",
      hours_per_day: load?.hours_per_day ?? "",
    }),
  );
  const dailyEnergyKwh = loads.reduce(
    (sum, load) => sum + load.estimated_kwh_day,
    0,
  );
  const demandSummary = {
    dailyEnergyKwh,
    annualEnergyKwh: dailyEnergyKwh * 365,
    connectedPowerKw: loads.reduce(
      (sum, load) => sum + (load.quantity * load.power_w) / 1000,
      0,
    ),
    equipmentCount: loads.length,
  };

  const handleAddLoad = () => {
    loadsArray.append(NEW_LOAD, {
      focusName: `demand.loads.${loadsArray.fields.length}.device`,
    });
  };

  const handleRemoveLoad = (index: number) => {
    if (loadsArray.fields.length <= 1) {
      toast.error("Minimal satu baris peralatan harus tersedia.");
      return;
    }
    loadsArray.remove(index);
  };

  /* --- Badge sumber: "Input pengguna" bila nilai beda dari contoh awal -- */
  const sourceFor = (
    path: FormFieldPath,
    meta: NumberFieldMeta,
  ): FieldSource =>
    get(watchedValues, path) !== get(SIMULATION_FORM_DEFAULTS, path)
      ? SOURCE.user
      : meta.source;

  /* --- Field yang saling terkait -------------------------------------- */
  // Field komponen nonaktif tidak divalidasi, jadi error lamanya dibuang.
  const handlePvToggle = (enabled: boolean) => {
    if (!enabled) clearErrors("pv");
    // Error skenario PV bergantung pada toggle ini (superRefine schema).
    if (isSubmitted) trigger("optimization.scenarios");
  };

  const handleBatteryToggle = (enabled: boolean) => {
    if (!enabled) clearErrors("battery");
  };

  const handleScenarioToggle = (
    id: SimulationFormValues["optimization"]["scenarios"][number],
    checked: boolean,
  ) => {
    const current = form.getValues("optimization.scenarios");
    const next = checked
      ? SCENARIO_OPTIONS.map((option) => option.id).filter(
          (key) => key === id || current.includes(key),
        )
      : current.filter((key) => key !== id);
    setValue("optimization.scenarios", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  /* --- Ringkasan sidebar ----------------------------------------------- */
  const summary = {
    ...demandSummary,
    totalGeneratorKw:
      toNumber(watchedValues.generators?.unit_count) *
      toNumber(watchedValues.generators?.rated_power_each_kw),
    pvEnabled,
    batteryEnabled,
    scenarios: SCENARIO_OPTIONS.filter((option) =>
      selectedScenarios.includes(option.id),
    ).map((option) => ({
      id: option.id,
      label:
        option.id === "pv_diesel_battery" && !batteryEnabled
          ? `${option.label} (tanpa baterai)`
          : option.label,
    })),
  };

  /* --- Stepper --------------------------------------------------------- */
  const [activeStep, setActiveStep] = useActiveSection(STEP_KEYS);
  const activeIndex = STEP_KEYS.indexOf(activeStep);

  const steps = SIMULATION_STEPS.map((step, index) => {
    const hasError = step.sections.some((section) => Boolean(errors[section]));
    let state: StepState = "default";
    if (index === activeIndex) state = "active";
    else if (index < activeIndex && !hasError) state = "done";
    return { ...step, state, hasError };
  });

  const scrollToStep = (key: SimulationStepKey) => {
    setActiveStep(key);
    document
      .getElementById(key)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --- Submit / reset -------------------------------------------------- */
  const createSimulation = useCreateSimulation();

  const onValid = (values: SimulationFormValues) => {
    createSimulation.mutate(toSimulationRequest(values), {
      onSuccess: (response) => {
        router.push(ROUTES.simulasiProses(response.payload.id));
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Gagal menjalankan optimasi"));
      },
    });
  };

  const onInvalid = (formErrors: FieldErrors<SimulationFormValues>) => {
    const step = firstErrorStep(formErrors);
    toast.error("Masih ada input yang belum valid", {
      description: step ? `Periksa bagian "${step.title}".` : undefined,
    });
    if (step) scrollToStep(step.key);
  };

  const handleReset = () => {
    reset(SIMULATION_FORM_DEFAULTS);
    toast.success("Formulir dikembalikan ke contoh awal");
  };

  return {
    control,
    register,
    errors,
    sourceFor,
    currency,
    watchedValues,
    // Card 02
    loadFields: loadsArray.fields,
    demandSummary,
    handleAddLoad,
    handleRemoveLoad,
    // Card 03, 05 & 07
    handlePvToggle,
    handleBatteryToggle,
    handleScenarioToggle,
    // Sidebar
    summary,
    steps,
    scrollToStep,
    // Aksi
    onSubmit: handleSubmit(onValid, onInvalid),
    handleReset,
    isSubmitting: createSimulation.isPending,
  };
};

export type InputSimulasiController = ReturnType<
  typeof useInputSimulasiContainer
>;
