import { IconArrowRight, IconRestore } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { API_MODE, type ApiMode } from "@/lib/env";

/** Sumber hasil yang akan dipakai (NEXT_PUBLIC_API_MODE). */
const API_MODE_NOTE: Record<ApiMode, string> = {
  auto: "Hasil dari backend; otomatis pakai mock FE bila backend error",
  backend: "Hasil dari backend",
  mock: "Mode mock FE: backend tidak dipanggil",
};

interface FormFooterProps {
  isSubmitting: boolean;
  onReset: () => void;
}

const FormFooter = ({ isSubmitting, onReset }: FormFooterProps) => {
  return (
    <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={isSubmitting}
        className="h-10 gap-2 rounded-md border-line-strong bg-surface px-4 text-body-strong text-fg-primary"
      >
        <IconRestore aria-hidden className="size-4" stroke={1.75} />
        Reset ke default
      </Button>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center">
        <p className="text-center text-fg-tertiary text-small">
          {API_MODE_NOTE[API_MODE]}
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[38px] gap-2 rounded-md px-4 text-body-strong hover:bg-brand-hover"
        >
          {isSubmitting ? "Menyiapkan solver..." : "Jalankan optimasi"}
          {isSubmitting ? (
            <Spinner className="size-4" />
          ) : (
            <IconArrowRight aria-hidden className="size-4" stroke={1.75} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FormFooter;
