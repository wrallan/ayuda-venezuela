import { z } from "zod";

// ----------------------------------------------------------------------------
// Validadores venezolanos reutilizables
// ----------------------------------------------------------------------------

// Cédula venezolana: V-12345678, E-12345678, o solo números (6 a 9 dígitos)
export const cedulaSchema = z
  .string()
  .trim()
  .min(6, "La cédula es muy corta")
  .max(12, "La cédula es muy larga")
  .regex(
    /^[VEve][-\s]?\d{6,9}$|^\d{6,9}$/,
    "Formato inválido. Usa V-12345678 o E-12345678"
  )
  .transform((val) => {
    // Normaliza a formato V-12345678 / E-12345678
    const cleaned = val.replace(/\s/g, "");
    const match = cleaned.match(/^([VEve])-?(\d{6,9})$/);
    if (match) return `${match[1].toUpperCase()}-${match[2]}`;
    return `V-${cleaned}`;
  });

// Teléfono venezolano: acepta formatos comunes 0414-1234567, +584141234567, etc.
export const telefonoSchema = z
  .string()
  .trim()
  .min(7, "El teléfono es muy corto")
  .max(20, "El teléfono es muy largo")
  .regex(/^[0-9+\-\s()]+$/, "Solo se permiten números y los símbolos + - ( )")
  .transform((val) => val.replace(/[\s\-()]/g, ""))
  .refine((val) => /^\+?[0-9]{7,15}$/.test(val), {
    message: "Formato de teléfono inválido",
  });

// Texto libre "seguro": rechaza patrones típicos de inyección SQL/HTML
// (defensa en profundidad — la defensa real es el uso de queries
// parametrizadas vía Supabase, esto es una capa adicional de higiene).
const dangerousPattern = /(<script|<\/script|;--|\bUNION\b\s+\bSELECT\b|\bDROP\b\s+\bTABLE\b)/i;

export const textoSeguro = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `Debe tener al menos ${min} caracteres`)
    .max(max, `No puede exceder ${max} caracteres`)
    .refine((val) => !dangerousPattern.test(val), {
      message: "El texto contiene patrones no permitidos",
    });

// ----------------------------------------------------------------------------
// Reporte ciudadano (formulario público "reportar caso")
// ----------------------------------------------------------------------------
export const tipoPuntoEnum = z.enum(["ayuda", "donacion", "persona", "riesgo"]);

export const reporteCiudadanoSchema = z.object({
  nombre_contacto: textoSeguro(2, 120),
  telefono: telefonoSchema,
  cedula: cedulaSchema,
  zona_afectada: textoSeguro(2, 120),
  tipo_ayuda_solicitada: tipoPuntoEnum.default("ayuda"),
  descripcion: textoSeguro(5, 2000),
  personas_afectadas: z.coerce.number().int().min(0).max(100000).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export type ReporteCiudadanoInput = z.infer<typeof reporteCiudadanoSchema>;

// ----------------------------------------------------------------------------
// Punto de ayuda (creado por admin desde el mapa)
// ----------------------------------------------------------------------------
export const estadoSeveridadEnum = z.enum(["critico", "parcial", "estable"]);

export const puntoAyudaSchema = z.object({
  tipo: tipoPuntoEnum,
  titulo: textoSeguro(2, 120),
  descripcion: textoSeguro(0, 2000).optional().or(z.literal("")),
  zona: textoSeguro(2, 120),
  estado_severidad: estadoSeveridadEnum.default("critico"),
  ayuda_qty: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  reporte_origen_id: z.string().uuid().nullable().optional(),
});

export type PuntoAyudaInput = z.infer<typeof puntoAyudaSchema>;

// ----------------------------------------------------------------------------
// Login admin
// ----------------------------------------------------------------------------
export const loginSchema = z.object({
  username: z.string().trim().min(1, "Usuario requerido").max(60),
  password: z.string().min(1, "Contraseña requerida").max(200),
});

// ----------------------------------------------------------------------------
// Revisión de reporte (aprobar / rechazar / convertir)
// ----------------------------------------------------------------------------
export const revisionReporteSchema = z.object({
  reporte_id: z.string().uuid(),
  accion: z.enum(["aprobar", "rechazar", "convertir"]),
  notas_admin: textoSeguro(0, 2000).optional().or(z.literal("")),
  // si accion === 'convertir', estos campos completan el punto resultante
  tipo: tipoPuntoEnum.optional(),
  estado_severidad: estadoSeveridadEnum.optional(),
  ayuda_qty: z.coerce.number().int().min(0).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

// ----------------------------------------------------------------------------
// Filtros del panel admin (para listar/exportar reportes por zona, estado, etc.)
// ----------------------------------------------------------------------------
export const filtroReportesSchema = z.object({
  zona: z.string().trim().max(120).optional(),
  estado: z.enum(["pendiente", "aprobado", "rechazado", "convertido", "todos"]).default("todos"),
  tipo: z.enum(["ayuda", "donacion", "persona", "riesgo", "todos"]).default("todos"),
  desde: z.string().optional(), // fecha ISO
  hasta: z.string().optional(),
});
