# Mapa de Ayuda Humanitaria — Venezuela

Plataforma de geolocalización para el monitoreo, reporte y distribución de
ayuda humanitaria. Mapa público sin login, panel de administración en una
ruta secreta, y reportes ciudadanos validados antes de publicarse.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + shadcn/ui (Radix)
- **Mapa:** MapLibre GL JS + react-map-gl
- **Backend / DB:** Supabase (PostgreSQL + PostGIS)
- **Validación:** Zod + react-hook-form
- **Excel:** librería `xlsx` (exportar/importar)
- **Despliegue:** Vercel

---

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (plan gratuito sirve para empezar).
2. Dentro del proyecto, ve a **SQL Editor** → **New query**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia **todo** su contenido, pégalo en el editor y ejecútalo (botón **Run**).
   - Esto crea las tablas, los tipos, los índices, las políticas de seguridad (RLS) y habilita Realtime.
4. Ve a **Project Settings → API** y copia:
   - `Project URL` → lo usarás como `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (sección "service_role", no la anon) → `SUPABASE_SERVICE_ROLE_KEY`
   - **La service_role key es muy sensible: nunca la pongas en el frontend ni la compartas.**

## 2. Crear tu usuario administrador

Tu contraseña **nunca se guarda en texto plano**, se guarda como hash bcrypt.
Ya generé el hash correspondiente a la contraseña que me indicaste
(`27Venezula2026`) para que solo tengas que copiar y pegar:

En **Supabase → SQL Editor**, ejecuta:

```sql
insert into admin_users (username, password_hash)
values ('Joshua', '$2a$12$UxJktG1XrPQprBEF18mSaeVq3hiaA/ZHeYCyIXRF8O1Fer7TgEyoe');
```

Esto crea tu único usuario admin. Para entrar usarás:
- Usuario: `Joshua`
- Contraseña: `27Venezula2026`

> Si en el futuro quieres **cambiar la contraseña**, corre localmente:
> `node scripts/hash-password.mjs "tu-nueva-contraseña"` y actualiza el hash en Supabase con:
> `update admin_users set password_hash = 'el-nuevo-hash' where username = 'Joshua';`

## 3. Configurar variables de entorno

Copia `.env.example` como `.env.local` y completa los valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
SUPABASE_SERVICE_ROLE_KEY=tu-clave-service-role
SESSION_SECRET=una-cadena-aleatoria-de-al-menos-32-caracteres
```

Para generar un `SESSION_SECRET` seguro, corre en tu terminal:
```
openssl rand -base64 48
```

## 4. Probar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` para el mapa público, y
`http://localhost:3000/AyudaJ` para el panel de administrador.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub (revisa que `.env.local` **no** se suba — ya está en `.gitignore`).
2. En Vercel, importa el repositorio.
3. En **Project Settings → Environment Variables**, agrega las 4 variables del paso 3 (las mismas, para "Production", "Preview" y "Development").
4. Despliega. Tu mapa público quedará en `https://tu-dominio.vercel.app` y el panel admin en `https://tu-dominio.vercel.app/AyudaJ`.

---

## Cómo funciona el sistema

### Mapa público (`/`)
Cualquier visitante ve el mapa de Venezuela con todos los puntos publicados,
sin necesidad de login. Los puntos nuevos aparecen en tiempo real (vía
Supabase Realtime) y disparan una notificación visual a todos los
visitantes conectados.

### Reportar un caso (`/reportar`)
Formulario público estructurado y validado (equivalente al "chat" de
reporte de casos): nombre, cédula, teléfono, zona, tipo de ayuda y
descripción. Valida formato de cédula venezolana (V-12345678 / E-12345678)
y de teléfono. **Estos reportes no se publican en el mapa automáticamente**
— quedan pendientes hasta que el admin los revisa, para evitar
desinformación.

### Panel de administrador (`/AyudaJ`)
Ruta no listada en ningún menú ni enlace público. Pide usuario y
contraseña; solo accede quien las conozca. Una vez dentro:

- **Crear punto:** clic en el mini-mapa para fijar coordenadas, eliges el
  tipo (ayuda=rojo, donación=verde, personas=azul, riesgo=amarillo),
  título, zona, severidad y cantidad.
- **Puntos:** lista de todos los puntos creados, con opción de eliminar.
- **Reportes:** todos los reportes ciudadanos, con filtros por zona,
  estado y tipo. Cada reporte se puede aprobar, rechazar, o **convertir
  directamente en un punto del mapa**. Exportable a Excel con los
  filtros aplicados.
- **Respaldo:** exporta todos los puntos a un archivo `.xlsx`, o importa
  un archivo previamente exportado para restaurar datos — útil mientras
  el sistema sigue en desarrollo, para no perder el trabajo.

### Seguridad implementada

- **Sin inyección SQL:** todas las consultas usan el cliente oficial de
  Supabase con parámetros tipados; nunca se concatenan strings para
  formar SQL. Las políticas de Row Level Security en PostgreSQL además
  garantizan que, incluso si una ruta tuviera un error, el cliente público
  no puede escribir puntos ni leer reportes ajenos.
- **Contraseña con hash bcrypt:** nunca se guarda ni se transmite en
  texto plano más allá del momento del login.
- **Sesión por JWT en cookie httpOnly:** no accesible desde JavaScript del
  navegador (mitiga robo de sesión vía XSS), expira a las 2 horas.
- **Rate limiting:** límites de intentos en login (anti fuerza bruta) y en
  el envío de reportes (anti-spam).
- **Validación doble (cliente + servidor):** con Zod; el servidor nunca
  confía en lo que llega del navegador.

---

## Estructura del proyecto

```
app/
  page.tsx                  → mapa público
  reportar/page.tsx         → formulario de reporte ciudadano
  AyudaJ/page.tsx           → login de admin
  AyudaJ/dashboard/page.tsx → panel de administración
  api/                      → rutas de servidor (auth, points, reports)
components/
  map/                      → mapa, leyenda, panel de detalle
  admin/                    → paneles del dashboard
  forms/                    → formulario de reporte ciudadano
  ui/                       → componentes base (botón, input, etc.)
lib/
  supabase/                 → clientes de Supabase (público y admin)
  auth/                     → sesión JWT y rate limiting
  validation/                → esquemas Zod compartidos
supabase/
  schema.sql                → esquema completo de base de datos
scripts/
  hash-password.mjs         → generador de hash para cambiar la contraseña
```
# ayuda-venezuela
