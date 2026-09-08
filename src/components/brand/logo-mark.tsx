import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground shadow-soft",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      TP
    </div>
  );
}
