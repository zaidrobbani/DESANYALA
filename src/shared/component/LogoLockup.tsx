import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoLockupProps {
  className?: string;
}

const LogoLockup = ({ className }: LogoLockupProps) => {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/brand/logo-symbol.svg"
        alt=""
        width={24}
        height={24}
        priority
      />
      <span className="text-forest text-h3">DesaNyala</span>
    </span>
  );
};

export default LogoLockup;
