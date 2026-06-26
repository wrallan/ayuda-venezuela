"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, LogOut, MapPinPlus, ListChecks, Inbox, Save } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CrearPuntoPanel } from "@/components/admin/crear-punto-panel";
import { ListaPuntosPanel } from "@/components/admin/lista-puntos-panel";
import { ReportesPanel } from "@/components/admin/reportes-panel";
import { BackupPanel } from "@/components/admin/backup-panel";
import type { PuntoAyuda } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [puntos, setPuntos] = React.useState<PuntoAyuda[]>([]);
  const [cargandoPuntos, setCargandoPuntos] = React.useState(true);

  const cargarPuntos = React.useCallback(async () => {
    setCargandoPuntos(true);
    try {
      const res = await fetch("/api/points", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setPuntos(data.points ?? []);
    } finally {
      setCargandoPuntos(false);
    }
  }, []);

  React.useEffect(() => {
    cargarPuntos();
  }, [cargarPuntos]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/AyudaJ");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink-50">
      <header className="flex items-center justify-between border-b border-ink-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-bandera-700 text-white">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-base font-semibold leading-tight text-ink-900">
              Panel de administración
            </h1>
            <p className="text-xs text-ink-500">Gestión de puntos y reportes</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </Button>
      </header>

      <div className="px-6 py-6">
        <Tabs defaultValue="crear">
          <TabsList>
            <TabsTrigger value="crear" className="gap-1.5">
              <MapPinPlus className="h-3.5 w-3.5" /> Crear punto
            </TabsTrigger>
            <TabsTrigger value="puntos" className="gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Puntos ({puntos.length})
            </TabsTrigger>
            <TabsTrigger value="reportes" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" /> Reportes
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-1.5">
              <Save className="h-3.5 w-3.5" /> Respaldo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crear">
            {!cargandoPuntos && <CrearPuntoPanel puntos={puntos} onCreado={cargarPuntos} />}
          </TabsContent>

          <TabsContent value="puntos">
            <ListaPuntosPanel puntos={puntos} onEliminado={cargarPuntos} />
          </TabsContent>

          <TabsContent value="reportes">
            <ReportesPanel onPuntoCreado={cargarPuntos} />
          </TabsContent>

          <TabsContent value="backup">
            <BackupPanel onImportado={cargarPuntos} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
