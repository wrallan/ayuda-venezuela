"use client";

import * as React from "react";
import { Download, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackupPanel({ onImportado }: { onImportado: () => void }) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importando, setImportando] = React.useState(false);
  const [resultado, setResultado] = React.useState<string | null>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/points/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setResultado(data.error || "No se pudo importar el archivo.");
        return;
      }
      setResultado(`Importados: ${data.importados}. Omitidos por errores: ${data.omitidos}.`);
      onImportado();
    } finally {
      setImportando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-ink-200 bg-white p-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-ink-900">Respaldo de datos</h3>
        <p className="mt-1 text-xs text-ink-500">
          Mientras el sistema está en desarrollo, exporta los puntos periódicamente para no perder
          información, y restáuralos si es necesario.
        </p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => window.open("/api/points/export", "_blank")}
        >
          <Download className="h-3.5 w-3.5" />
          Exportar puntos (.xlsx)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={importando}
          onClick={() => fileInputRef.current?.click()}
        >
          {importando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Importar puntos (.xlsx)
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {resultado && (
        <p className="flex items-start gap-1.5 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {resultado}
        </p>
      )}
    </div>
  );
}
