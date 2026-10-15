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

  // Halaman pindah otomatis ke Hasil saat semua skenario selesai.
  useEffect(() => {
    if (status !== "completed" || !simulationId) return;
    const timer = setTimeout(() => {
      router.replace(ROUTES.simulasiHasil(simulationId));
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, simulationId, router]);

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
    router.push(ROUTES.simulasi);
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
    isLoading: progressQuery.isLoading && Boolean(simulationId),
    loadError,
    retry: () => progressQuery.refetch(),
    isCancelling: cancelSimulation.isPending,
    handleCancel,
    handleBackToInput,
    handleViewResult,
  };
};
