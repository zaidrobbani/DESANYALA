import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type FieldErrors,
  get,
  useForm,
  useFormState,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import type { LoadProfileValidation } from "@/repository/simulation/dto";
import {
  useCreateSimulation,
  useGetLoadProfilePresets,
  useGetSimulationInput,
} from "@/repository/simulation/query";
import {
  parseDieselCapacity,
  type SimulationFormValues,
  type SimulationSectionKey,
  simulationFormSchema,
} from "@/schemas/simulation/simulation.schema";
import type { FieldSource } from "@/shared/component/NumberField";
import { ROUTES } from "@/shared/constant/routes";
import { scaleLoadProfile } from "@/shared/util/load-profile";
import { formatNumber, parseIdNumber } from "@/shared/util/number";
import {
  DEFAULT_PRESET_ID,
  type NumberFieldMeta,
  PROVINCE_TIMEZONE,
  SIMULATION_FORM_DEFAULTS,
  SIMULATION_STEPS,
  SOURCE,
} from "../data";
import { fromSimulationRequest } from "../util/from-simulation-request";
import {
  type ParsedLoadProfile,
  parseLoadProfileCsv,
} from "../util/parse-load-profile-csv";
import { toSimulationRequest } from "../util/to-simulation-request";
import { useActiveSection } from "./useActiveSection";

export type StepState = "done" | "active" | "default";

export type ValidationState =
  | { kind: "ready"; validation: LoadProfileValidation }
  | { kind: "loading" }
  | { kind: "server" };

const SECTION_KEYS = SIMULATION_STEPS.map((step) => step.key);

const UNIT_WORDS = [
  "Nol",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
];

const toUsdHelper = (template: string, capexJuta: string, kurs: string) => {
  const capex = parseIdNumber(capexJuta);
  const rate = parseIdNumber(kurs);
  if (Number.isNaN(capex) || Number.isNaN(rate) || rate <= 0) {
    return "Isi kurs untuk konversi ke USD.";
  }
  const usd = Math.round((capex * 1_000_000) / rate / 10) * 10;
  return template.replace("{usd}", formatNumber(usd, 0));
};

const firstErrorSection = (errors: FieldErrors<SimulationFormValues>) =>
  SECTION_KEYS.find((key) => Boolean(errors[key]));

export const useInputSimulasiContainer = () => {
  const router = useRouter();

  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: SIMULATION_FORM_DEFAULTS,
    mode: "onTouched",
  });
  const { control, register, handleSubmit, setValue, reset } = form;
  const { errors } = useFormState({ control });

  // Semua nilai form. Dipakai untuk badge sumber: objek baru setiap ada
  // perubahan, jadi aman dengan memoisasi React Compiler (berbeda dengan
  // `dirtyFields` RHF yang dimutasi di tempat).
  const watchedValues = useWatch({ control });
  const kebutuhan = useWatch({ control, name: "kebutuhan" });
  const [latitude, longitude] = useWatch({
    control,
    name: ["lokasi.latitude", "lokasi.longitude"],
  });
  const [capexPv, capexBaterai, capexInverter, kurs] = useWatch({
    control,
    name: [
      "biaya.capex_pv",
      "biaya.capex_baterai",
      "biaya.capex_inverter",
      "biaya.kurs",
    ],
  });
  const dieselKapasitas = useWatch({
    control,
    name: "parameter.diesel_kapasitas",
  });

  /* --- Isi ulang dari run sebelumnya (?dari=<id>&fokus=<field>) ------- */
  const searchParams = useSearchParams();
  const fromId = searchParams.get("dari") ?? "";
  const focusField = searchParams.get("fokus");
  const previousInputQuery = useGetSimulationInput(fromId);
  const previousRequest = previousInputQuery.data?.payload;
  const previousInputError = previousInputQuery.error;

  useEffect(() => {
    if (!previousRequest) return;
    reset(fromSimulationRequest(previousRequest));
    const lostFile =
      previousRequest.load.source === "manual" &&
      previousRequest.load.profile_file_name;
    toast.success("Input dimuat dari run sebelumnya", {
      description: lostFile
        ? `Unggah ulang file ${lostFile} bila masih diperlukan.`
        : undefined,
    });
    if (!focusField) return;
    // Tunggu nilai hasil reset tergambar sebelum fokus ke field.
    const frame = requestAnimationFrame(() => {
      const field = document.getElementById(focusField);
      if (!(field instanceof HTMLElement)) return;
      field.focus({ preventScroll: true });
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [previousRequest, focusField, reset]);

  useEffect(() => {
    if (!previousInputError) return;
    toast.error("Input run sebelumnya tidak dapat dimuat", {
      description: getErrorMessage(
        previousInputError,
        "Form memakai nilai default.",
      ),
    });
  }, [previousInputError]);

  /* --- Profil beban contoh ------------------------------------------- */
  const presetsQuery = useGetLoadProfilePresets();
  const presets = presetsQuery.data?.payload ?? [];
  const selectedPreset =
    presets.find((preset) => preset.id === kebutuhan.preset_id) ?? presets[0];
  const referencePreset =
    presets.find((preset) => preset.id === DEFAULT_PRESET_ID) ?? presets[0];

  /* --- File profil beban (mode manual) ------------------------------- */
  const [parsedFile, setParsedFile] = useState<{
    file: File;
    result: ParsedLoadProfile | null;
  } | null>(null);
  const profileFile = kebutuhan.profil_file;

  useEffect(() => {
    if (!profileFile || !profileFile.name.toLowerCase().endsWith(".csv")) {
      return;
    }
    let cancelled = false;
    parseLoadProfileCsv(profileFile)
      .then((result) => {
        if (!cancelled) setParsedFile({ file: profileFile, result });
      })
      .catch(() => {
        if (!cancelled) setParsedFile({ file: profileFile, result: null });
      });
    return () => {
      cancelled = true;
    };
  }, [profileFile]);

  const csvResult =
    parsedFile && parsedFile.file === profileFile ? parsedFile.result : null;

  /* --- Data turunan untuk grafik & panel validasi --------------------- */
  const isManual = kebutuhan.mode === "manual";
  const manualEnergy = parseIdNumber(kebutuhan.energi_harian);
  const manualPeak = parseIdNumber(kebutuhan.daya_puncak);
  const manualValid =
    manualEnergy > 0 && manualPeak > 0 && manualEnergy / 24 <= manualPeak;

  let chartProfile: number[] | null = null;
  if (!isManual) {
    chartProfile = selectedPreset?.hourly_profile_kw ?? null;
  } else if (csvResult?.hourlyAverageKw) {
    chartProfile = csvResult.hourlyAverageKw;
  } else if (manualValid && referencePreset) {
    chartProfile = scaleLoadProfile(
      referencePreset.hourly_profile_kw,
      manualEnergy,
      manualPeak,
    );
  }

  let validationState: ValidationState;
  if (!isManual) {
    validationState = selectedPreset
      ? { kind: "ready", validation: selectedPreset.validation }
      : { kind: "loading" };
  } else if (profileFile) {
    if (!profileFile.name.toLowerCase().endsWith(".csv")) {
      validationState = { kind: "server" };
    } else {
      validationState = csvResult
        ? { kind: "ready", validation: csvResult.validation }
        : { kind: "loading" };
    }
  } else {
    // Tanpa file: profil 24 jam hasil penskalaan, diulang 365 hari.
    validationState = {
      kind: "ready",
      validation: {
        rows: 8760,
        interval_minutes: 60,
        unit: "kW",
        unit_consistent: true,
        negative_count: 0,
        interpolated_count: 0,
      },
    };
  }

  /* --- Badge sumber: "Input pengguna" bila nilai beda dari nilai bawaan -- */
  const presetIrradiance = (presetId: string | undefined) => {
    const preset = presets.find((item) => item.id === presetId);
    return preset
      ? formatNumber(preset.avg_irradiance_kwh_m2_day)
      : SIMULATION_FORM_DEFAULTS.parameter.pv_radiasi;
  };

  const autoValueFor = (path: string): unknown =>
    path === "parameter.pv_radiasi"
      ? presetIrradiance(kebutuhan.preset_id)
      : get(SIMULATION_FORM_DEFAULTS, path);

  const sourceFor = (
    path: `${SimulationSectionKey}.${string}`,
    meta: NumberFieldMeta,
  ): FieldSource =>
    get(watchedValues, path) !== autoValueFor(path) ? SOURCE.user : meta.source;

  const diesel = parseDieselCapacity(dieselKapasitas);
  const dieselHelper = diesel
    ? `${UNIT_WORDS[diesel.units] ?? formatNumber(diesel.units)} unit eksisting.`
    : "Format: jumlah unit × kW per unit.";

  const usdHelpers = {
    capex_pv: (template: string) => toUsdHelper(template, capexPv, kurs),
    capex_baterai: (template: string) =>
      toUsdHelper(template, capexBaterai, kurs),
    capex_inverter: (template: string) =>
      toUsdHelper(template, capexInverter, kurs),
  };

  const latValue = parseIdNumber(latitude);
  const lngValue = parseIdNumber(longitude);
  const coordinates =
    !errors.lokasi?.latitude &&
    !errors.lokasi?.longitude &&
    !Number.isNaN(latValue) &&
    !Number.isNaN(lngValue) &&
    Math.abs(latValue) <= 90 &&
    Math.abs(lngValue) <= 180
      ? { lat: latValue, lng: lngValue }
      : null;

  /* --- Interaksi field yang saling terkait ---------------------------- */
  const handleProvinceChange = (province: string) => {
    setValue("lokasi.provinsi", province, {
      shouldDirty: true,
      shouldValidate: true,
    });
    const timezone = PROVINCE_TIMEZONE[province];
    if (timezone) {
      setValue("lokasi.zona_waktu", timezone, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handlePresetChange = (presetId: string) => {
    // Radiasi ikut preset selama pengguna belum mengubahnya sendiri.
    const followsPreset =
      form.getValues("parameter.pv_radiasi") ===
      presetIrradiance(form.getValues("kebutuhan.preset_id"));

    setValue("kebutuhan.preset_id", presetId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (followsPreset) {
      setValue("parameter.pv_radiasi", presetIrradiance(presetId), {
        shouldValidate: true,
      });
    }
  };

  const handleModeChange = (mode: string) => {
    if (mode !== "contoh" && mode !== "manual") return;
    setValue("kebutuhan.mode", mode, { shouldDirty: true });
    form.clearErrors("kebutuhan");
  };

  const handleFileChange = (file: File | null) => {
    setValue("kebutuhan.profil_file", file, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  /* --- Stepper --------------------------------------------------------- */
  const [activeSection, setActiveSection] = useActiveSection(SECTION_KEYS);
  const activeIndex = SECTION_KEYS.indexOf(activeSection);

  const steps = SIMULATION_STEPS.map((step, index) => {
    const hasError = Boolean(errors[step.key]);
    let state: StepState = "default";
    if (index === activeIndex) state = "active";
    else if (index < activeIndex && !hasError) state = "done";
    return { ...step, state, hasError };
  });

  const scrollToSection = (key: SimulationSectionKey) => {
    setActiveSection(key);
    document
      .getElementById(key)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* --- Submit / reset -------------------------------------------------- */
  const createSimulation = useCreateSimulation();

  const onValid = (values: SimulationFormValues) => {
    createSimulation.mutate(
      {
        payload: toSimulationRequest(values),
        file:
          values.kebutuhan.mode === "manual"
            ? values.kebutuhan.profil_file
            : null,
      },
      {
        onSuccess: (response) => {
          router.push(ROUTES.simulasiProses(response.payload.id));
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, "Gagal menjalankan optimasi"));
        },
      },
    );
  };

  const onInvalid = (formErrors: FieldErrors<SimulationFormValues>) => {
    const section = firstErrorSection(formErrors);
    toast.error("Masih ada input yang belum valid", {
      description: section
        ? `Periksa bagian "${SIMULATION_STEPS.find((s) => s.key === section)?.title}".`
        : undefined,
    });
  };

  const handleReset = () => {
    reset(SIMULATION_FORM_DEFAULTS);
    setParsedFile(null);
    toast.success("Input dikembalikan ke nilai default");
  };

  return {
    form,
    control,
    register,
    errors,
    sourceFor,
    // Lokasi
    coordinates,
    handleProvinceChange,
    // Kebutuhan
    kebutuhan,
    presets,
    selectedPreset,
    isPresetsLoading: presetsQuery.isLoading,
    presetsError: presetsQuery.error,
    refetchPresets: presetsQuery.refetch,
    chartProfile,
    handlePresetChange,
    handleModeChange,
    handleFileChange,
    validationState,
    // Parameter & biaya
    dieselHelper,
    usdHelpers,
    // Stepper
    steps,
    scrollToSection,
    // Aksi
    onSubmit: handleSubmit(onValid, onInvalid),
    handleReset,
    isSubmitting: createSimulation.isPending,
  };
};

export type InputSimulasiController = ReturnType<
  typeof useInputSimulasiContainer
>;
