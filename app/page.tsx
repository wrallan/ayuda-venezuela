"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HeartHandshake, MessageSquarePlus, Loader2 } from "lucide-react";
import { usePuntosRealtime } from "@/lib/hooks/use-puntos-realtime";
import { MapaLeyenda } from "@/components/map/mapa-leyenda";
import { PuntoDetailSheet } from "@/components/map/punto-detail-sheet";
import { NotificacionNuevoPunto } from "@/components/map/notificacion-nuevo-punto";
import { Button } from "@/components/ui/button";
import type { PuntoAyuda } from "@/types";

// El mapa usa WebGL y APIs del navegador; se carga solo en cliente.
const MapaVenezuela = dynamic(
  () => import("@/components/map/mapa-venezuela").then((m) => m.MapaVenezuela),
  { ssr: false }
);

export default function HomePage() {
  const { puntos, cargando, nuevoPunto, limpiarNotificacion } = usePuntosRealtime();
  const [puntoSeleccionado, setPuntoSeleccionado] = React.useState<PuntoAyuda | null>(null);

  return (
    <main className="relative flex h-screen w-screen flex-col overflow-hidden">
      <header className="z-10 flex items-center justify-between border-b border-ink-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-bandera-700 text-white">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-base font-semibold leading-tight text-ink-900">
              Mapa de Ayuda Humanitaria
            </h1>
            <p className="text-xs text-ink-500">Venezuela · datos en tiempo real</p>
          </div>
        </div>
        <Link href="/reportar">
          <Button size="sm" className="gap-1.5">
            <MessageSquarePlus className="h-4 w-4" />
            Reportar un caso
          </Button>
        </Link>
      </header>

      <div className="relative flex-1">
        {cargando ? (
          <div className="flex h-full items-center justify-center gap-2 text-ink-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando mapa…
          </div>
        ) : (
          <>
            <MapaVenezuela puntos={puntos} onMarkerClick={setPuntoSeleccionado} />
            <MapaLeyenda />
          </>
        )}
      </div>

      <PuntoDetailSheet punto={puntoSeleccionado} onOpenChange={(open) => !open && setPuntoSeleccionado(null)} />
      <NotificacionNuevoPunto punto={nuevoPunto} onClose={limpiarNotificacion} />
    </main>
  );
}
