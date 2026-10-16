import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface FormNoteProps {
  tone?: "info" | "warning";
  children: React.ReactNode;
  className?: string;
}

/** Catatan asumsi/keterbatasan model: ikon + teks berwarna, tanpa kotak. */
const FormNote = ({ tone = "info", children, className }: FormNoteProps) => {
  const NoteIcon = tone === "warning" ? IconAlertTriangle : IconInfoCircle;
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-small",
        tone === "warning" ? "text-warning" : "text-fg-tertiary",
        className,
      )}
    >
      <NoteIcon aria-hidden className="mt-0.5 size-4 shrink-0" stroke={1.75} />
      <span>{children}</span>
    </p>
  );
};

export default FormNote;
