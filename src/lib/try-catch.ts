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
  /** FastAPI: string, objek `{ status, message }`, atau list error Pydantic. */
  detail?:
    | string
    | { status?: string; message?: string }
    | { loc?: (string | number)[]; msg?: string }[];
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

/** Label lokasi error Pydantic tanpa prefix "body", mis. "pv.capacity_max_kwp". */
export const formatErrorLoc = (loc: (string | number)[] = []) =>
  loc.filter((part, index) => !(index === 0 && part === "body")).join(".");

const detailMessage = (detail: ApiErrorResponse["detail"]) => {
  if (!detail) return undefined;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const lines = detail.map((item) => {
      const where = formatErrorLoc(item.loc);
      return where ? `${where}: ${item.msg}` : item.msg;
    });
    return lines.filter(Boolean).join("; ") || undefined;
  }
  return detail.message;
};

const detailCode = (detail: ApiErrorResponse["detail"]) => {
  if (Array.isArray(detail)) return "VALIDATION_ERROR";
  if (detail && typeof detail === "object") return detail.status;
  return undefined;
};

const fallbackMessageByStatus = (status?: number) => {
  if (status === 500)
    return "Server backend mengalami kesalahan internal (500).";
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
    detailMessage(resData.detail) ||
    fallbackMessageByStatus(status);

  return {
    message,
    code:
      errPayload?.error_code ??
      errRoot?.error_code ??
      detailCode(resData.detail) ??
      (status ? `HTTP_${status}` : undefined),
    details: errPayload?.details ?? resData.detail,
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

    if (axios.isCancel(error)) {
      parsedError = new ApiError("Permintaan dibatalkan.", {
        code: "CANCELLED",
      });
    } else if (
      axios.isAxiosError(error) &&
      !error.response &&
      error.code === "ECONNABORTED"
    ) {
      parsedError = new ApiError(
        "Backend tidak merespons dalam batas waktu. Coba lagi atau kurangi periode simulasi.",
        { code: "TIMEOUT" },
      );
    } else if (axios.isAxiosError<ApiErrorResponse>(error)) {
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
