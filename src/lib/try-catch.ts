import axios from "axios";

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = ApiError> = Success<T> | Failure<E>;

interface ApiErrorResponse {
  payload?: {
    error?: {
      error_code?: string;
      message?: string;
      details?: unknown;
    };
    message?: string;
  };
  error?: string | { error_code?: string; message?: string };
  message?: string;
  detail?: string;
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  details?: unknown;

  constructor(
    message: string,
    opts?: { code?: string; status?: number; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.status = opts?.status;
    this.details = opts?.details;
  }
}

const fallbackMessageByStatus = (status?: number) => {
  if (status === 502) return "Server backend tidak dapat dijangkau (502).";
  if (status === 503) return "Server backend sedang maintenance (503).";
  if (status === 504) return "Koneksi ke server backend timeout (504).";
  if (!status) return "Gagal terhubung ke server. Coba lagi nanti.";
  return `Terjadi kesalahan (HTTP ${status}).`;
};

export const extractApiError = (rawResData: unknown, status?: number) => {
  const resData = (
    typeof rawResData === "object" && rawResData !== null ? rawResData : {}
  ) as ApiErrorResponse;
  const errPayload = resData.payload?.error;
  const errRoot = typeof resData.error === "object" ? resData.error : undefined;

  const message =
    errPayload?.message ||
    errRoot?.message ||
    (typeof resData.error === "string" ? resData.error : undefined) ||
    resData.payload?.message ||
    resData.message ||
    resData.detail ||
    fallbackMessageByStatus(status);

  return {
    message,
    code:
      errPayload?.error_code ??
      errRoot?.error_code ??
      (status ? `HTTP_${status}` : undefined),
    details: errPayload?.details,
  };
};

export async function tryCatch<T, E = ApiError>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error: unknown) {
    let parsedError: ApiError;

    if (axios.isAxiosError<ApiErrorResponse>(error)) {
      const status = error.response?.status;
      const extracted = extractApiError(error.response?.data, status);
      parsedError = new ApiError(extracted.message || error.message, {
        code: extracted.code,
        status,
        details: extracted.details,
      });
    } else if (error instanceof Error) {
      parsedError = new ApiError(error.message);
    } else {
      parsedError = new ApiError(String(error));
    }

    return { data: null, error: parsedError as E };
  }
}

export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};
