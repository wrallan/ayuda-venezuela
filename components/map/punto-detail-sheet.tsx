"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TipoPuntoBadge } from "@/components/map/tipo-punto-badge";
import { ESTADO_SEVERIDAD_LABEL, type PuntoAyuda } from "@/types";
import { MapPin, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PuntoDetailSheetProps {
  punto: PuntoAyuda | null;
  onOpenChange: (open: boolean) => void;
}

export function PuntoDetailSheet({ punto, onOpenChange }: PuntoDetailSheetProps) {
  return (
    <Sheet open={!!punto} onOpenChange={onOpenChange}>
      <SheetContent side="left">
        {punto && (
          <>
            <SheetHeader>
              <TipoPuntoBadge tipo={punto.tipo} className="mb-1 w-fit" />
              <SheetTitle>{punto.titulo}</SheetTitle>
              <SheetDescription>{punto.zona}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-6 py-5">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      punto.estado_severidad === "critico"
                        ? "#C23B2E"
                        : punto.estado_severidad === "parcial"
                        ? "#D6A019"
                        : "#2E8B57",
                  }}
                />
                <span className="font-medium text-ink-800">
                  {ESTADO_SEVERIDAD_LABEL[punto.estado_severidad]}
                </span>
              </div>

              {punto.descripcion && (
                <p className="text-sm leading-relaxed text-ink-700">{punto.descripcion}</p>
              )}

              <div className="flex flex-col gap-3 rounded-md bg-ink-50 p-4 text-sm text-ink-600">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{punto.ayuda_qty} persona(s) / unidades vinculadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-xs">
                    {punto.lat.toFixed(5)}, {punto.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    Registrado el{" "}
                    {format(new Date(punto.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
