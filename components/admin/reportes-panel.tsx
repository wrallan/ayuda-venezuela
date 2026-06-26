"use client";

import * as React from "react";
import { Download, Filter, CheckCircle2, XCircle, MapPinPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipoPuntoBadge } from "@/components/map/tipo-punto-badge";
import type { ReporteCiudadano, EstadoReporte, TipoPunto } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTADO_BADGE: Record<EstadoReporte, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-estado-riesgo-bg text-estado-riesgo" },
  aprobado: { label: "Aprobado", className: "bg-estado-persona-bg text-estado-persona" },
  rechazado: { label: "Rechazado", className: "bg-estado-critico-bg text-estado-critico" },
  convertido: { label: "Convertido a punto", className: "bg-estado-donacion-bg text-estado-donacion" },
};

export function ReportesPanel({ onPuntoCreado }: { onPuntoCreado: () => void }) {
  const [reportes, setReportes] = React.useState<ReporteCiudadano[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [filtroZona, setFiltroZona] = React.useState("");
  const [filtroEstado, setFiltroEstado] = React.useState<EstadoReporte | "todos">("todos");
  const [filtroTipo, setFiltroTipo] = React.useState<TipoPunto | "todos">("todos");
  const [procesandoId, setProcesandoId] = React.useState<string | null>(null);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (filtroZona) params.set("zona", filtroZona);
    if (filtroEstado !== "todos") params.set("estado", filtroEstado);
    if (filtroTipo !== "todos") params.set("tipo", filtroTipo);
    return params.toString();
  }, [filtroZona, filtroEstado, filtroTipo]);

  const cargarReportes = React.useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch(`/api/reports?${queryString}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setReportes(data.reports ?? []);
    } finally {
      setCargando(false);
    }
  }, [queryString]);

  React.useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  async function handleAccion(reporteId: string, accion: "aprobar" | "rechazar" | "convertir") {
    setProcesandoId(reporteId);
    try {
      const res = await fetch("/api/reports/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporte_id: reporteId, accion }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo procesar la acción.");
        return;
      }
      if (accion === "convertir") onPuntoCreado();
      await cargarReportes();
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-ink-200 bg-ink-50 p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filtro-zona" className="flex items-center gap-1 text-xs">
            <Filter className="h-3 w-3" /> Zona
          </Label>
          <Input
            id="filtro-zona"
            placeholder="Buscar por zona…"
            value={filtroZona}
            onChange={(e) => setFiltroZona(e.target.value)}
            className="h-9 w-44"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Estado</Label>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as EstadoReporte | "todos")}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="convertido">Convertido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as TipoPunto | "todos")}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ayuda">Zona de ayuda</SelectItem>
              <SelectItem value="donacion">Donaciones</SelectItem>
              <SelectItem value="persona">Personas</SelectItem>
              <SelectItem value="riesgo">Riesgo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={() => window.open(`/api/reports/export?${queryString}`, "_blank")}
        >
          <Download className="h-3.5 w-3.5" />
          Exportar a Excel
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando reportes…
        </div>
      ) : reportes.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500">No hay reportes con estos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink-200">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {reportes.map((r) => (
                <tr key={r.id} className="align-top hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-800">{r.nombre_contacto}</p>
                    <p className="font-mono text-xs text-ink-500">{r.telefono}</p>
                    <p className="font-mono text-xs text-ink-500">{r.cedula}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{r.zona_afectada}</td>
                  <td className="px-4 py-3">
                    <TipoPuntoBadge tipo={r.tipo_ayuda_solicitada} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-ink-600">{r.descripcion}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${ESTADO_BADGE[r.estado].className}`}
                    >
                      {ESTADO_BADGE[r.estado].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    {r.estado === "pendiente" || r.estado === "aprobado" ? (
                      <div className="flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          variant="success"
                          disabled={procesandoId === r.id}
                          onClick={() => handleAccion(r.id, "convertir")}
                          className="gap-1"
                        >
                          <MapPinPlus className="h-3.5 w-3.5" /> Convertir en punto
                        </Button>
                        {r.estado === "pendiente" && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={procesandoId === r.id}
                              onClick={() => handleAccion(r.id, "aprobar")}
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={procesandoId === r.id}
                              onClick={() => handleAccion(r.id, "rechazar")}
                              className="gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
