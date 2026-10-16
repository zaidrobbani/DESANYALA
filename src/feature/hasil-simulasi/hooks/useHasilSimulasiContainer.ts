import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import type { ScenarioKey } from "@/repository/simulation/dto";
import { useGetSimulationResult } from "@/repository/simulation/query";
import { ROUTES } from "@/shared/constant/routes";
import { type InputField, SCENARIO_ORDER } from "../data";
import {
  buildDailyCsv,
  buildDispatchCsv,
  buildSummaryCsv,
  buildSummaryJson,
  downloadTextFile,
} from "../util/build-result-csv";
import {
  defaultScenarioKey,
  isUsableScenario,
  lowestLcoeScenario,
  orderedScenarios,
} from "../util/result-view";

const toFileSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isScenarioKey = (value: string | null): value is ScenarioKey =>
  SCENARIO_ORDER.includes(value as ScenarioKey);

export const useHasilSimulasiContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationId = searchParams.get("id") ?? "";
  const requestedScenario = searchParams.get("skenario");

  const resultQuery = useGetSimulationResult(simulationId);
  const result = resultQuery.data?.payload ?? null;
  const response = result?.response ?? null;

  const scenarios = response ? orderedScenarios(response) : [];
  const selectedKey =
    response &&
    isScenarioKey(requestedScenario) &&
    scenarios.some((s) => s.scenario_id === requestedScenario)
      ? requestedScenario
      : response
        ? defaultScenarioKey(response)
        : null;
  const selected = scenarios.find((s) => s.scenario_id === selectedKey) ?? null;
  const isSelectedUsable = selected ? isUsableScenario(selected) : false;
  const usableScenarios = scenarios.filter(isUsableScenario);
  const cheapest = response ? lowestLcoeScenario(response) : null;
  /** Pembanding saat skenario terpilih gagal. */
  const alternative =
    usableScenarios.find((s) => s.scenario_id !== selectedKey) ?? null;

  const loadError = !simulationId
    ? "ID simulasi tidak ada di URL. Jalankan optimasi dari halaman input."
    : resultQuery.error
      ? getErrorMessage(resultQuery.error, "Gagal memuat hasil simulasi")
      : result && scenarios.length === 0
        ? "Tidak ada hasil skenario untuk run ini."
        : null;

  const fileBase = () => {
    const name = toFileSlug(result?.input.project.name ?? "");
    return `desanyala-${name || simulationId}`;
  };

  const download = (build: () => string, filename: string, type?: string) => {
    try {
      downloadTextFile(build(), filename, type);
      toast.success(`File disiapkan: ${filename}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menyiapkan file"));
    }
  };

  const handleDownloadSummaryCsv = () => {
    if (result) {
      download(() => buildSummaryCsv(result), `${fileBase()}-ringkasan.csv`);
    }
  };

  const handleDownloadJson = () => {
    if (result) {
      download(
        () => buildSummaryJson(result),
        `${fileBase()}-output.json`,
        "application/json",
      );
    }
  };

  const handleDownloadDispatch = () => {
    if (selected) {
      download(
        () => buildDispatchCsv(selected),
        `${fileBase()}-${selected.scenario_id}-dispatch-96.csv`,
      );
    }
  };

  const handleDownloadDaily = () => {
    if (selected && response) {
      download(
        () => buildDailyCsv(selected, response.time_step_hours),
        `${fileBase()}-${selected.scenario_id}-harian.csv`,
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectScenario = (key: ScenarioKey) => {
    router.replace(ROUTES.simulasiHasil(simulationId, key), { scroll: false });
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

  const handleEditField = (field: InputField) => {
    router.push(ROUTES.simulasiDari(simulationId, field));
  };

  return {
    result,
    response,
    selected,
    selectedKey,
    isSelectedUsable,
    cheapest,
    alternative,
    isLoading: resultQuery.isLoading && Boolean(simulationId),
    loadError,
    canRetry: Boolean(simulationId) && Boolean(resultQuery.error),
    retry: () => resultQuery.refetch(),
    handleDownloadSummaryCsv,
    handleDownloadJson,
    handleDownloadDispatch,
    handleDownloadDaily,
    handlePrint,
    handleSelectScenario,
    handleBackToInput,
    handleNewSimulation,
    handleEditField,
  };
};
