export type TipoPunto = "ayuda" | "donacion" | "persona" | "riesgo";
export type EstadoSeveridad = "critico" | "parcial" | "estable";
export type EstadoReporte = "pendiente" | "aprobado" | "rechazado" | "convertido";

export interface PuntoAyuda {
  id: string;
  tipo: TipoPunto;
  titulo: string;
  descripcion: string | null;
  zona: string;
  estado_severidad: EstadoSeveridad;
  ayuda_qty: number;
  lat: number;
  lng: number;
  created_at: string;
}

export interface ReporteCiudadano {
  id: string;
  nombre_contacto: string;
  telefono: string;
  cedula: string;
  zona_afectada: string;
  tipo_ayuda_solicitada: TipoPunto;
  descripcion: string;
  personas_afectadas: number | null;
  lat: number | null;
  lng: number | null;
  estado: EstadoReporte;
  notas_admin: string | null;
  created_at: string;
  revisado_at: string | null;
}

export const TIPO_PUNTO_CONFIG: Record<
  TipoPunto,
  { label: string; color: string; colorBg: string; descripcionCorta: string }
> = {
  ayuda: {
    label: "Zona de ayuda",
    color: "#C23B2E",
    colorBg: "#FBEAE7",
    descripcionCorta: "Punto donde se requiere asistencia",
  },
  donacion: {
    label: "Zona de donaciones",
    color: "#2E8B57",
    colorBg: "#E8F4ED",
    descripcionCorta: "Punto de recolección o entrega de donaciones",
  },
  persona: {
    label: "Ubicación de personas",
    color: "#2B5FAD",
    colorBg: "#E8EFF8",
    descripcionCorta: "Personas o familias ubicadas en esta zona",
  },
  riesgo: {
    label: "Posible riesgo",
    color: "#D6A019",
    colorBg: "#FBF3DF",
    descripcionCorta: "Zona con riesgo potencial identificado",
  },
};

export const ESTADO_SEVERIDAD_LABEL: Record<EstadoSeveridad, string> = {
  critico: "Crítico — sin ayuda",
  parcial: "Atendido parcialmente",
  estable: "Estable — abastecido",
};
