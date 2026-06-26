"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TipoPuntoBadge } from "@/components/map/tipo-punto-badge";
import { ESTADO_SEVERIDAD_LABEL, type PuntoAyuda } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ListaPuntosPanel({ puntos, onEliminado }: { puntos: PuntoAyuda[]; onEliminado: () => void }) {
  const [eliminandoId, setEliminandoId] = React.useState<string | null>(null);

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este punto del mapa? Esta acción no se puede deshacer.")) return;
    setEliminandoId(id);
    try {
      const res = await fetch(`/api/points/${id}`, { method: "DELETE" });
      if (res.ok) onEliminado();
    } finally {
      setEliminandoId(null);
    }
  }

  if (puntos.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-500">Aún no se han creado puntos.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-ink-200">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Severidad</th>
            <th className="px-4 py-3">Cantidad</th>
            <th className="px-4 py-3">Creado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {puntos.map((p) => (
            <tr key={p.id} className="hover:bg-ink-50/60">
              <td className="px-4 py-3">
                <TipoPuntoBadge tipo={p.tipo} />
              </td>
              <td className="px-4 py-3 font-medium text-ink-800">{p.titulo}</td>
              <td className="px-4 py-3 text-ink-600">{p.zona}</td>
              <td className="px-4 py-3 text-ink-600">{ESTADO_SEVERIDAD_LABEL[p.estado_severidad]}</td>
              <td className="px-4 py-3 text-ink-600">{p.ayuda_qty}</td>
              <td className="px-4 py-3 text-ink-500">
                {format(new Date(p.created_at), "d MMM yyyy", { locale: es })}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={eliminandoId === p.id}
                  onClick={() => handleEliminar(p.id)}
                  aria-label="Eliminar punto"
                >
                  <Trash2 className="h-4 w-4 text-estado-critico" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
