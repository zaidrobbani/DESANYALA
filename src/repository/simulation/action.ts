import { axiosPublic } from "@/lib/axios";
import { isMockApi } from "@/lib/env";
import { tryCatch } from "@/lib/try-catch";
import type {
  LoadProfilePresetListResponse,
  SimulationCreateResponse,
  SimulationProgressResponse,
  SimulationRequest,
  SimulationResultResponse,
} from "./dto";
import {
  mockCancelSimulation,
  mockCreateSimulation,
  mockGetLoadProfilePresets,
  mockGetSimulationProgress,
  mockGetSimulationResult,
} from "./mock";

export const GetLoadProfilePresets =
  async (): Promise<LoadProfilePresetListResponse> => {
    if (isMockApi()) return mockGetLoadProfilePresets();

    const { data, error } = await tryCatch(
      axiosPublic.get<LoadProfilePresetListResponse>("/load-profiles/presets"),
    );

    if (error || !data?.data) {
      throw error ?? new Error("Gagal memuat profil beban contoh");
    }

    return data.data;
  };

export const CreateSimulation = async (
  payload: SimulationRequest,
  loadProfileFile: File | null,
): Promise<SimulationCreateResponse> => {
  if (isMockApi()) return mockCreateSimulation(payload);

  const request = loadProfileFile
    ? (() => {
        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        formData.append("load_profile", loadProfileFile);
        return axiosPublic.post<SimulationCreateResponse>(
          "/simulations",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
      })()
    : axiosPublic.post<SimulationCreateResponse>("/simulations", payload);

  const { data, error } = await tryCatch(request);

  if (error || !data?.data) {
    throw error ?? new Error("Gagal menjalankan optimasi");
  }

  return data.data;
};

export const GetSimulationProgress = async (
  id: string,
): Promise<SimulationProgressResponse> => {
  if (isMockApi()) return mockGetSimulationProgress(id);

  const { data, error } = await tryCatch(
    axiosPublic.get<SimulationProgressResponse>(
      `/simulations/${encodeURIComponent(id)}/progress`,
    ),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal memuat progres solver");
  }

  return data.data;
};

export const CancelSimulation = async (id: string): Promise<void> => {
  if (isMockApi()) return mockCancelSimulation(id);

  const { error } = await tryCatch(
    axiosPublic.post(`/simulations/${encodeURIComponent(id)}/cancel`),
  );

  if (error) {
    throw error;
  }
};

export const GetSimulationResult = async (
  id: string,
): Promise<SimulationResultResponse> => {
  if (isMockApi()) return mockGetSimulationResult(id);

  const { data, error } = await tryCatch(
    axiosPublic.get<SimulationResultResponse>(
      `/simulations/${encodeURIComponent(id)}/result`,
    ),
  );

  if (error || !data?.data) {
    throw error ?? new Error("Gagal memuat hasil simulasi");
  }

  return data.data;
};
