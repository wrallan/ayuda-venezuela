-- ============================================================================
-- ESQUEMA: Plataforma de Ayuda Humanitaria - Venezuela
-- Motor: Supabase (PostgreSQL + PostGIS)
-- ============================================================================
-- Ejecutar este archivo completo en: Supabase Dashboard > SQL Editor > New query
-- ============================================================================

-- Extensión espacial para coordenadas y queries geográficas
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- TABLA: admin_users
-- Solo existirá UNA fila (el admin único, "Joshua"). La contraseña se guarda
-- con hash bcrypt, nunca en texto plano. El hash se genera con el script
-- scripts/hash-password.mjs incluido en el proyecto, NO se escribe a mano.
-- ----------------------------------------------------------------------------
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type tipo_punto as enum ('ayuda', 'donacion', 'persona', 'riesgo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_severidad as enum ('critico', 'parcial', 'estable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_reporte as enum ('pendiente', 'aprobado', 'rechazado', 'convertido');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABLA: puntos_ayuda
-- Los puntos visibles en el mapa público. SOLO el admin puede insertar,
-- actualizar o borrar (forzado vía RLS + uso exclusivo de service role
-- en las rutas de API protegidas, nunca desde el cliente).
-- ----------------------------------------------------------------------------
create table if not exists puntos_ayuda (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_punto not null,
  titulo text not null check (char_length(titulo) between 2 and 120),
  descripcion text check (char_length(descripcion) <= 2000),
  zona text not null check (char_length(zona) between 2 and 120),
  estado_severidad estado_severidad not null default 'critico',
  ayuda_qty integer not null default 0 check (ayuda_qty >= 0),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  geom geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) stored,
  reporte_origen_id uuid, -- si nació de un reporte ciudadano convertido
  creado_por text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_puntos_geom on puntos_ayuda using gist (geom);
create index if not exists idx_puntos_tipo on puntos_ayuda (tipo);
create index if not exists idx_puntos_zona on puntos_ayuda (zona);

-- ----------------------------------------------------------------------------
-- TABLA: reportes_ciudadanos
-- El "chat" / formulario de casos que llena cualquier persona.
-- Nunca se muestra en el mapa público directamente: solo tras
-- revisión y conversión manual por el admin (estado_reporte = 'convertido').
-- ----------------------------------------------------------------------------
create table if not exists reportes_ciudadanos (
  id uuid primary key default gen_random_uuid(),
  nombre_contacto text not null check (char_length(nombre_contacto) between 2 and 120),
  telefono text not null,
  cedula text not null,
  zona_afectada text not null check (char_length(zona_afectada) between 2 and 120),
  tipo_ayuda_solicitada tipo_punto not null default 'ayuda',
  descripcion text not null check (char_length(descripcion) between 5 and 2000),
  personas_afectadas integer check (personas_afectadas >= 0),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  estado estado_reporte not null default 'pendiente',
  notas_admin text check (char_length(notas_admin) <= 2000),
  ip_hash text, -- hash de IP para anti-spam, nunca la IP en claro
  created_at timestamptz not null default now(),
  revisado_at timestamptz,
  constraint chk_telefono_formato check (telefono ~ '^\+?[0-9]{7,15}$'),
  constraint chk_cedula_formato check (cedula ~ '^[VEve][- ]?[0-9]{6,9}$' or cedula ~ '^[0-9]{6,9}$')
);

create index if not exists idx_reportes_estado on reportes_ciudadanos (estado);
create index if not exists idx_reportes_zona on reportes_ciudadanos (zona_afectada);
create index if not exists idx_reportes_created on reportes_ciudadanos (created_at desc);

alter table puntos_ayuda
  add constraint fk_reporte_origen
  foreign key (reporte_origen_id) references reportes_ciudadanos(id) on delete set null;

-- ----------------------------------------------------------------------------
-- TRIGGER: actualizar updated_at automáticamente
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_puntos_updated_at on puntos_ayuda;
create trigger trg_puntos_updated_at
  before update on puntos_ayuda
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Regla general: el cliente público (clave anon) SOLO puede leer puntos
-- y SOLO puede insertar reportes ciudadanos (nunca leer, editar ni borrar).
-- Toda escritura de puntos y toda lectura de reportes pasa exclusivamente
-- por rutas de servidor que usan la service_role key (nunca expuesta al
-- navegador) y que además exigen sesión de admin verificada.
-- ----------------------------------------------------------------------------
alter table puntos_ayuda enable row level security;
alter table reportes_ciudadanos enable row level security;
alter table admin_users enable row level security;

-- admin_users: nadie accede vía API pública, ni con anon ni autenticado.
-- Solo la service_role (usada exclusivamente en el servidor) puede leer.
drop policy if exists "sin acceso publico" on admin_users;
create policy "sin acceso publico" on admin_users
  for all using (false);

-- puntos_ayuda: lectura pública abierta (es el mapa público)
drop policy if exists "lectura publica de puntos" on puntos_ayuda;
create policy "lectura publica de puntos" on puntos_ayuda
  for select using (true);

-- puntos_ayuda: ninguna escritura desde el cliente anon; solo service_role
-- (las policies de "for all using(false)" bloquean anon/authenticated;
-- la service_role key de Supabase bypassea RLS por diseño, que es
-- exactamente el comportamiento que queremos para las rutas de admin).
drop policy if exists "sin escritura publica de puntos" on puntos_ayuda;
create policy "sin escritura publica de puntos" on puntos_ayuda
  for insert with check (false);

drop policy if exists "sin update publico de puntos" on puntos_ayuda;
create policy "sin update publico de puntos" on puntos_ayuda
  for update using (false);

drop policy if exists "sin delete publico de puntos" on puntos_ayuda;
create policy "sin delete publico de puntos" on puntos_ayuda
  for delete using (false);

-- reportes_ciudadanos: el público puede INSERTAR (enviar un caso) pero
-- nunca leer ni modificar reportes existentes (evita exponer cédulas,
-- teléfonos y datos personales de otros reportantes).
drop policy if exists "insercion publica de reportes" on reportes_ciudadanos;
create policy "insercion publica de reportes" on reportes_ciudadanos
  for insert with check (true);

drop policy if exists "sin lectura publica de reportes" on reportes_ciudadanos;
create policy "sin lectura publica de reportes" on reportes_ciudadanos
  for select using (false);

drop policy if exists "sin update publico de reportes" on reportes_ciudadanos;
create policy "sin update publico de reportes" on reportes_ciudadanos
  for update using (false);

drop policy if exists "sin delete publico de reportes" on reportes_ciudadanos;
create policy "sin delete publico de reportes" on reportes_ciudadanos
  for delete using (false);

-- ----------------------------------------------------------------------------
-- Habilitar Realtime para que los puntos nuevos disparen notificación
-- instantánea a todos los usuarios conectados al mapa público.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table puntos_ayuda;

-- ============================================================================
-- FIN DEL ESQUEMA
-- Después de correr esto, ejecuta scripts/hash-password.mjs localmente
-- para generar el hash de tu contraseña e insertar el usuario admin
-- (instrucciones completas en README.md, sección "Configurar el admin").
-- ============================================================================
