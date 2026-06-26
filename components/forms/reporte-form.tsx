"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reporteCiudadanoSchema } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPO_PUNTO_CONFIG, type TipoPunto } from "@/types";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";

// El formulario reusa el esquema del servidor: si algo pasa la validación
// aquí, pasará también la validación del API (misma fuente de verdad).
type FormValues = z.input<typeof reporteCiudadanoSchema>;

export function ReporteForm() {
  const [enviado, setEnviado] = React.useState(false);
  const [errorEnvio, setErrorEnvio] = React.useState<string | null>(null);
  const [ubicacionEstado, setUbicacionEstado] = React.useState<"idle" | "buscando" | "ok" | "error">(
    "idle"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reporteCiudadanoSchema),
    defaultValues: { tipo_ayuda_solicitada: "ayuda" },
  });

  const lat = watch("lat");
  const lng = watch("lng");

  function obtenerUbicacion() {
    if (!navigator.geolocation) {
      setUbicacionEstado("error");
      return;
    }
    setUbicacionEstado("buscando");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude);
        setValue("lng", pos.coords.longitude);
        setUbicacionEstado("ok");
      },
      () => setUbicacionEstado("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onSubmit(values: FormValues) {
    setErrorEnvio(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorEnvio(data.error || "No se pudo enviar el reporte.");
        return;
      }
      setEnviado(true);
    } catch {
      setErrorEnvio("Hubo un problema de conexión. Intenta de nuevo.");
    }
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-estado-donacion/30 bg-estado-donacion-bg px-6 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-estado-donacion" />
        <h2 className="font-display text-lg font-semibold text-ink-900">Reporte enviado</h2>
        <p className="max-w-sm text-sm text-ink-600">
          Tu caso fue recibido y será revisado por el equipo. No se publica en el mapa hasta que sea
          verificado, para evitar información falsa.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre_contacto">Nombre completo</Label>
          <Input id="nombre_contacto" placeholder="Ej: María Pérez" {...register("nombre_contacto")} />
          {errors.nombre_contacto && (
            <p className="text-xs text-estado-critico">{errors.nombre_contacto.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cedula">Cédula de identidad</Label>
          <Input id="cedula" placeholder="V-12345678" {...register("cedula")} />
          {errors.cedula && <p className="text-xs text-estado-critico">{errors.cedula.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telefono">Teléfono de contacto</Label>
          <Input id="telefono" placeholder="0414-1234567" {...register("telefono")} />
          {errors.telefono && <p className="text-xs text-estado-critico">{errors.telefono.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zona_afectada">Zona afectada</Label>
          <Input id="zona_afectada" placeholder="Ej: Petare, Caracas" {...register("zona_afectada")} />
          {errors.zona_afectada && (
            <p className="text-xs text-estado-critico">{errors.zona_afectada.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo_ayuda_solicitada">Tipo de ayuda</Label>
          <Select
            defaultValue="ayuda"
            onValueChange={(val) => setValue("tipo_ayuda_solicitada", val as TipoPunto)}
          >
            <SelectTrigger id="tipo_ayuda_solicitada">
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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="personas_afectadas">Personas afectadas (aprox.)</Label>
          <Input
            id="personas_afectadas"
            type="number"
            min={0}
            placeholder="Ej: 5"
            {...register("personas_afectadas")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción de la situación</Label>
        <textarea
          id="descripcion"
          rows={4}
          placeholder="Describe qué está pasando y qué tipo de ayuda se necesita…"
          className="flex w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bandera-500"
          {...register("descripcion")}
        />
        {errors.descripcion && <p className="text-xs text-estado-critico">{errors.descripcion.message}</p>}
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-ink-200 bg-ink-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-800">Ubicación (opcional, recomendado)</span>
          <Button type="button" variant="outline" size="sm" onClick={obtenerUbicacion} className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {ubicacionEstado === "buscando" ? "Buscando…" : "Usar mi ubicación"}
          </Button>
        </div>
        {ubicacionEstado === "ok" && lat && lng && (
          <p className="font-mono text-xs text-estado-donacion">
            ✓ {lat.toFixed(5)}, {lng.toFixed(5)}
          </p>
        )}
        {ubicacionEstado === "error" && (
          <p className="text-xs text-estado-critico">
            No se pudo obtener la ubicación. Puedes continuar sin ella.
          </p>
        )}
      </div>

      {errorEnvio && (
        <p className="rounded-md bg-estado-critico-bg px-3 py-2 text-sm text-estado-critico">{errorEnvio}</p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="gap-2">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar reporte
      </Button>
    </form>
  );
}
