import type { Icon } from "@tabler/icons-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  id?: string;
  icon: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Panel utama: putih polos di atas latar abu, tanpa garis tepi dan bayangan. */
const SectionCard = ({
  id,
  icon: IconComponent,
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) => {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn(
        "flex w-full scroll-mt-24 flex-col gap-5 rounded-lg bg-surface p-4 sm:p-6",
        className,
      )}
    >
      <header className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconComponent
              aria-hidden
              className="size-5 shrink-0 text-brand"
              stroke={1.75}
            />
            <h2 id={id ? `${id}-title` : undefined} className="text-h3">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-fg-tertiary text-small">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
};

export default SectionCard;
