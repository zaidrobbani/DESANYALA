import type { Icon } from "@tabler/icons-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface StatusBannerProps {
  icon: Icon;
  iconClassName?: string;
  title: string;
  titleClassName?: string;
  description: React.ReactNode;
  /** Baris log apa adanya (Code/Small). */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * Status solver/validasi (Figma: Solver Banner): panel putih, ikon + judul
 * berwarna, log apa adanya. Tanpa latar tint dan garis aksen.
 */
const StatusBanner = ({
  icon: IconComponent,
  iconClassName,
  title,
  titleClassName,
  description,
  meta,
  className,
}: StatusBannerProps) => {
  return (
    <section
      aria-live="polite"
      className={cn(
        "flex w-full items-start gap-3 rounded-md bg-surface px-4 py-3.5",
        className,
      )}
    >
      <IconComponent
        aria-hidden
        className={cn("mt-0.5 size-[18px] shrink-0", iconClassName)}
        stroke={1.75}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className={cn("text-body-strong", titleClassName)}>{title}</h2>
        <p className="text-fg-primary text-small">{description}</p>
        {meta && <p className="font-mono text-code text-fg-tertiary">{meta}</p>}
      </div>
    </section>
  );
};

export default StatusBanner;
