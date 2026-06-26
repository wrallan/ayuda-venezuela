"use client";

import * as React from "react";
import { Bell, X } from "lucide-react";
import { TIPO_PUNTO_CONFIG, type PuntoAyuda } from "@/types";

export function NotificacionNuevoPunto({
  punto,
  onClose,
}: {
  punto: PuntoAyuda | null;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!punto) return;
    const timer = setTimeout(onClose, 7000);
    return () => clearTimeout(timer);
  }, [punto, onClose]);

  if (!punto) return null;

  const config = TIPO_PUNTO_CONFIG[punto.tipo];

  return (
    <div className="animate-slide-in fixed right-4 top-4 z-50 flex w-80 items-start gap-3 rounded-md border border-ink-200 bg-white p-4 shadow-panel">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: config.colorBg }}
      >
        <Bell className="h-4 w-4" style={{ color: config.color }} />
      </span>
      <div className="flex-1 text-sm">
        <p className="font-medium text-ink-900">Nuevo punto en el mapa</p>
        <p className="text-ink-600">
          {config.label} · {punto.zona}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-ink-400 hover:text-ink-700"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
