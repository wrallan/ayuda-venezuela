import { TIPO_PUNTO_CONFIG, type TipoPunto } from "@/types";
import { cn } from "@/lib/utils";

export function TipoPuntoBadge({ tipo, className }: { tipo: TipoPunto; className?: string }) {
  const config = TIPO_PUNTO_CONFIG[tipo];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
      style={{ backgroundColor: config.colorBg, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
