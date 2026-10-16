import { cn } from "@/lib/utils";

export type SourceTone =
  | "paper"
  | "user"
  | "assumption"
  | "success"
  | "danger"
  | "neutral";

const TONE_CLASS: Record<SourceTone, string> = {
  paper: "text-source-paper",
  user: "text-brand",
  assumption: "text-warning",
  success: "text-success",
  danger: "text-danger",
  neutral: "text-fg-secondary",
};

interface SourceBadgeProps {
  tone: SourceTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * Label sumber/status berupa teks berwarna saja:
 * tanpa latar, tanpa titik, tanpa garis.
 */
const SourceBadge = ({ tone, children, className }: SourceBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap text-label",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
};

export default SourceBadge;
