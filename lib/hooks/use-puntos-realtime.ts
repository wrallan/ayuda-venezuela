"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PuntoAyuda } from "@/types";

export function usePuntosRealtime() {
  const [puntos, setPuntos] = React.useState<PuntoAyuda[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [nuevoPunto, setNuevoPunto] = React.useState<PuntoAyuda | null>(null);

  React.useEffect(() => {
    let activo = true;

    async function cargarInicial() {
      try {
        const res = await fetch("/api/points", { cache: "no-store" });
        const data = await res.json();
        if (activo && res.ok) setPuntos(data.points ?? []);
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarInicial();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("puntos_ayuda_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "puntos_ayuda" },
        (payload) => {
          const nuevo = payload.new as PuntoAyuda;
          setPuntos((prev) => [nuevo, ...prev]);
          setNuevoPunto(nuevo);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "puntos_ayuda" },
        (payload) => {
          const eliminado = payload.old as { id: string };
          setPuntos((prev) => prev.filter((p) => p.id !== eliminado.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "puntos_ayuda" },
        (payload) => {
          const actualizado = payload.new as PuntoAyuda;
          setPuntos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { puntos, cargando, nuevoPunto, limpiarNotificacion: () => setNuevoPunto(null) };
}
