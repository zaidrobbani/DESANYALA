import type { Icon } from "@tabler/icons-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface SubPanelProps {
  icon: Icon;
  iconClassName?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Subpanel di dalam section: latar bg-subtle, radius lg. */
const SubPanel = ({
  icon: IconComponent,
  iconClassName,
  title,
  description,
  children,
  className,
}: SubPanelProps) => {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 rounded-lg bg-subtle p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <IconComponent
            aria-hidden
            className={cn("size-[18px] shrink-0 text-brand", iconClassName)}
            stroke={1.75}
          />
          <h3 className="text-body-strong">{title}</h3>
        </div>
        {description && (
          <p className="text-fg-tertiary text-small">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default SubPanel;
