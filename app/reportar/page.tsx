import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReporteForm } from "@/components/forms/reporte-form";

export default function ReportarPage() {
  return (
    <main className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al mapa
        </Link>

        <div className="rounded-md border border-ink-200 bg-white p-7 shadow-panel">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Reportar un caso</h1>
          <p className="mt-1.5 text-sm text-ink-600">
            Completa este formulario para informar dónde se necesita ayuda. Tu reporte será revisado
            antes de aparecer en el mapa público.
          </p>

          <div className="mt-7">
            <ReporteForm />
          </div>
        </div>
      </div>
    </main>
  );
}
