import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import type {
  SimulationInputPath,
  SimulationRequest,
} from "@/repository/simulation/dto";
import {
  useGetLoadProfilePresets,
  useGetSimulationResult,
} from "@/repository/simulation/query";
import { ROUTES } from "@/shared/constant/routes";
import { formatNumber } from "@/shared/util/number";
import { INPUT_FIELD_LOCATION } from "../data";
import { buildResultCsv, downloadTextFile } from "../util/build-result-csv";
import { summarizeResult } from "../util/summarize-result";

/**
 * comparison = Baseline vs Hybrid (frame 02), infeasible = diagnosis
 * (frame 04), baseline = diesel saja (hybrid infeasible / tidak dijalankan).
 */
export type HasilView = "comparison" | "infeasible" | "baseline";

const toFileSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const describeLoad = (
  load: SimulationRequest["load"],
  presetName: string | undefined,
) =>
  load.source === "preset"
    ? (presetName ?? load.preset_id)
    : `Input manual · ${formatNumber(load.daily_energy_kwh)} kWh/hari · puncak ${formatNumber(load.peak_load_kw)} kW`;

export const useHasilSimulasiContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationId = searchParams.get("id") ?? "";
  const wantsBaseline = searchParams.get("view") === "baseline";

  const resultQuery = useGetSimulationResult(simulationId);
  const result = resultQuery.data?.payload ?? null;
  const summary = result ? summarizeResult(result) : null;
  const baseline = result?.scenarios.find((s) => s.key === "baseline");

  let view: HasilView | null = null;
  if (result) {
    if (wantsBaseline && baseline) view = "baseline";
    else if (result.failed_scenario) view = "infeasible";
    else if (summary) view = "comparison";
    else if (baseline) view = "baseline";
  }

  const presets = useGetLoadProfilePresets().data?.payload ?? [];
  const load = result?.input.load;
  const loadProfileLabel = load
    ? describeLoad(
        load,
        load.source === "preset"
          ? presets.find((preset) => preset.id === load.preset_id)?.name
          : undefined,
      )
    : "";

  const loadError = !simulationId
    ? "ID simulasi tidak ada di URL. Jalankan optimasi dari halaman input."
    : resultQuery.error
      ? getErrorMessage(resultQuery.error, "Gagal memuat hasil simulasi")
      : result && !view
        ? "Halaman hasil butuh skenario Baseline sebagai pembanding. Aktifkan Baseline di input lalu jalankan ulang."
        : null;

  const handleDownloadCsv = () => {
    if (!result) return;
    try {
      const village = toFileSlug(result.input.location.village_name);
      downloadTextFile(
        buildResultCsv(result),
        `desanyala-hasil-${village || result.id}.csv`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunduh CSV"));
    }
  };

  /** Buka input yang terisi nilai run ini. */
  const handleBackToInput = () => {
    router.push(
      simulationId ? ROUTES.simulasiDari(simulationId) : ROUTES.simulasi,
    );
  };

  const handleNewSimulation = () => {
    router.push(ROUTES.simulasi);
  };

  const handleEditField = (path: SimulationInputPath) => {
    router.push(
      ROUTES.simulasiDari(simulationId, INPUT_FIELD_LOCATION[path].field),
    );
  };

  const handleViewBaseline = () => {
    router.push(ROUTES.simulasiHasil(simulationId, "baseline"));
  };

  const handleBackToDiagnosis = () => {
    router.push(ROUTES.simulasiHasil(simulationId));
  };

  return {
    view,
    result,
    summary,
    baseline,
    loadProfileLabel,
    isLoading: resultQuery.isLoading && Boolean(simulationId),
    loadError,
    canRetry: Boolean(simulationId) && Boolean(resultQuery.error),
    retry: () => resultQuery.refetch(),
    handleDownloadCsv,
    handleBackToInput,
    handleNewSimulation,
    handleEditField,
    handleViewBaseline,
    handleBackToDiagnosis,
  };
};
