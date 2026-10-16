import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import type { SimulationRequest } from "@/repository/simulation/dto";
import {
  useGetLoadProfilePresets,
  useGetSimulationResult,
} from "@/repository/simulation/query";
import { ROUTES } from "@/shared/constant/routes";
import { formatNumber } from "@/shared/util/number";
import { buildResultCsv, downloadTextFile } from "../util/build-result-csv";
import { summarizeResult } from "../util/summarize-result";

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

  const resultQuery = useGetSimulationResult(simulationId);
  const result = resultQuery.data?.payload ?? null;
  const summary = result ? summarizeResult(result) : null;

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
      : result && !summary
        ? "Halaman hasil membandingkan Baseline dan Hybrid. Aktifkan kedua skenario di input lalu jalankan ulang."
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

  // Form input belum menyimpan nilai run sebelumnya, jadi "Kembali ke input"
  // dan "Jalankan simulasi baru" sama-sama membuka input dengan nilai default.
  const handleBackToInput = () => {
    router.push(ROUTES.simulasi);
  };

  return {
    result,
    summary,
    loadProfileLabel,
    isLoading: resultQuery.isLoading && Boolean(simulationId),
    loadError,
    canRetry: Boolean(simulationId) && Boolean(resultQuery.error),
    retry: () => resultQuery.refetch(),
    handleDownloadCsv,
    handleBackToInput,
  };
};
