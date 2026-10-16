import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/try-catch";
import {
  useCancelSimulation,
  useGetSimulationProgress,
} from "@/repository/simulation/query";
import { ROUTES } from "@/shared/constant/routes";
import { POLLING_INTERVAL_MS, REDIRECT_DELAY_MS } from "../data";

export const useProsesSolverContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationId = searchParams.get("id") ?? "";

  const progressQuery = useGetSimulationProgress(
    simulationId,
    POLLING_INTERVAL_MS,
  );
  const progress = progressQuery.data?.payload ?? null;
  const status = progress?.status;

  const cancelSimulation = useCancelSimulation();

  const scenarios = progress?.scenarios ?? [];
  // Respons backend sudah tiba (status skenario final), termasuk infeasible.
  const hasResponse =
    status !== "running" && scenarios.some((s) => s.progress === 1);
  const hasUsableScenario = scenarios.some(
    (s) => s.status === "optimal" || s.status === "feasible",
  );
  // Hasil bisa dibuka bila backend mengembalikan respons; kalau semua skenario
  // gagal, halaman Hasil hanya menampilkan diagnosis.
  const canViewResult = hasResponse;
  const shouldRedirect =
    status === "completed" || (status === "failed" && hasUsableScenario);

  // Halaman pindah otomatis ke Hasil saat ada skenario yang bisa dipakai.
  useEffect(() => {
    if (!shouldRedirect || !simulationId) return;
    const timer = setTimeout(() => {
      router.replace(ROUTES.simulasiHasil(simulationId));
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldRedirect, simulationId, router]);

  const handleCancel = () => {
    if (!simulationId) return;
    cancelSimulation.mutate(simulationId, {
      onSuccess: () => {
        toast.success("Optimasi dibatalkan");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Gagal membatalkan optimasi"));
      },
    });
  };

  const handleBackToInput = () => {
    router.push(
      simulationId ? ROUTES.simulasiDari(simulationId) : ROUTES.simulasi,
    );
  };

  const handleViewResult = () => {
    if (simulationId) router.replace(ROUTES.simulasiHasil(simulationId));
  };

  const loadError = !simulationId
    ? "ID simulasi tidak ada di URL. Jalankan optimasi dari halaman input."
    : progressQuery.error
      ? getErrorMessage(progressQuery.error, "Gagal memuat progres solver")
      : null;

  return {
    simulationId,
    progress,
    canViewResult,
    isLoading: progressQuery.isLoading && Boolean(simulationId),
    loadError,
    retry: () => progressQuery.refetch(),
    isCancelling: cancelSimulation.isPending,
    handleCancel,
    handleBackToInput,
    handleViewResult,
  };
};
