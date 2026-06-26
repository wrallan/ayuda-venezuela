"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { puntoAyudaSchema, type PuntoAyudaInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPO_PUNTO_CONFIG, type PuntoAyuda } from "@/types";
import { Loader2, MapPinPlus, CheckCircle2 } from "lucide-react";

const MapaSeleccion = dynamic(() => import("@/components/admin/mapa-seleccion").then((m) => m.MapaSeleccion), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-ink-500">Cargando mapa…</div>,
});

export function CrearPuntoPanel({ puntos, onCreado }: { puntos: PuntoAyuda[]; onCreado: () => void }) {
  const [seleccion, setSeleccion] = React.useState<{ lat: number; lng: number } | null>(null);
  const [exito, setExito] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PuntoAyudaInput>({
    resolver: zodResolver(puntoAyudaSchema),
    defaultValues: { tipo: "ayuda", estado_severidad: "critico", ayuda_qty: 0 },
  });

  const tipoActual = watch("tipo");

  function handleSelectCoords(coords: { lat: number; lng: number }) {
    setSeleccion(coords);
    setValue("lat", coords.lat, { shouldValidate: true });
    setValue("lng", coords.lng, { shouldValidate: true });
  }

  async function onSubmit(values: PuntoAyudaInput) {
    setError(null);
    setExito(false);
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo crear el punto.");
        return;
      }
      setExito(true);
      reset({ tipo: "ayuda", estado_severidad: "critico", ayuda_qty: 0 });
      setSeleccion(null);
      onCreado();
    } catch {
      setError("Hubo un problema de conexión.");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="h-[480px] overflow-hidden rounded-md border border-ink-200">
        <MapaSeleccion
          puntos={puntos}
          seleccion={seleccion}
          tipoSeleccionado={tipoActual}
          onSelect={handleSelectCoords}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="flex items-center gap-1.5 text-sm text-ink-600">
          <MapPinPlus className="h-4 w-4" />
          Haz clic en el mapa para fijar la ubicación
        </p>

        {seleccion && (
          <p className="font-mono text-xs text-ink-500">
            {seleccion.lat.toFixed(5)}, {seleccion.lng.toFixed(5)}
          </p>
        )}
        {(errors.lat || errors.lng) && (
          <p className="text-xs text-estado-critico">Selecciona una ubicación en el mapa.</p>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo">Tipo de punto</Label>
          <Controller
            control={control}
            name="tipo"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_PUNTO_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="titulo">Título</Label>
          <Input id="titulo" placeholder="Ej: Refugio temporal Petare" {...register("titulo")} />
          {errors.titulo && <p className="text-xs text-estado-critico">{errors.titulo.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zona">Zona</Label>
          <Input id="zona" placeholder="Ej: Petare, Caracas" {...register("zona")} />
          {errors.zona && <p className="text-xs text-estado-critico">{errors.zona.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estado_severidad">Severidad</Label>
            <Controller
              control={control}
              name="estado_severidad"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="estado_severidad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critico">Crítico</SelectItem>
                    <SelectItem value="parcial">Parcial</SelectItem>
                    <SelectItem value="estable">Estable</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ayuda_qty">Cantidad</Label>
            <Input id="ayuda_qty" type="number" min={0} {...register("ayuda_qty")} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <textarea
            id="descripcion"
            rows={3}
            className="flex w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bandera-500"
            {...register("descripcion")}
          />
        </div>

        {error && <p className="rounded-md bg-estado-critico-bg px-3 py-2 text-sm text-estado-critico">{error}</p>}
        {exito && (
          <p className="flex items-center gap-1.5 rounded-md bg-estado-donacion-bg px-3 py-2 text-sm text-estado-donacion">
            <CheckCircle2 className="h-4 w-4" /> Punto creado y publicado en el mapa.
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear punto
        </Button>
      </form>
    </div>
  );
}
