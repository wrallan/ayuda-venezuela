import { TIPO_PUNTO_CONFIG } from "@/types";

export function MapaLeyenda() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md border border-ink-200 bg-white/95 px-4 py-3 shadow-panel backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Leyenda</p>
      <ul className="flex flex-col gap-1.5">
        {Object.entries(TIPO_PUNTO_CONFIG).map(([tipo, config]) => (
          <li key={tipo} className="flex items-center gap-2 text-xs text-ink-700">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/80"
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
