-- supabase/migrations/20261015000003_admin_catalog.sql
-- ADR-022: el backend del panel /admin migra de la GitHub Contents API a
-- Supabase (tablas de catálogo + bucket de Storage para imágenes del admin).
-- Migración ADDITIVE (ADR-021): solo crea objetos nuevos; no modifica
-- tablas existentes.

-- ─── vehicles_catalog ─────────────────────────────────────
-- Copia de la colección vehicles de Content Collections. `data` es el JSON
-- completo del vehículo (validado con vehicleSchema antes de escribir).
create table if not exists public.vehicles_catalog (
  internal_code text primary key,
  data          jsonb not null,
  active        boolean not null default true,
  featured      boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- ─── routes_catalog ───────────────────────────────────────
-- Una fila por ruta (slug) e idioma. `frontmatter` es el YAML del MDX ya
-- parseado; `body` guarda el markdown plano.
create table if not exists public.routes_catalog (
  slug        text not null,
  locale      text not null check (locale in ('en', 'fr')),
  frontmatter jsonb not null,
  body        text not null default '',
  active      boolean not null default true,
  updated_at  timestamptz not null default now(),
  primary key (slug, locale)
);

-- ─── site_config ──────────────────────────────────────────
-- Configuración global del sitio (branding, hero, etc.). Singleton: la PK
-- booleana (default true) garantiza una única fila.
create table if not exists public.site_config (
  id         boolean primary key default true,
  config     jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────
-- Lectura pública del catálogo (anon), escritura SOLO vía service role:
-- no se crea ninguna policy de INSERT/UPDATE/DELETE, y el service role
-- bypasa RLS, por lo que solo el panel /admin (server) puede escribir.
alter table public.vehicles_catalog enable row level security;
alter table public.routes_catalog enable row level security;
alter table public.site_config enable row level security;

drop policy if exists "Public read vehicles_catalog" on public.vehicles_catalog;
create policy "Public read vehicles_catalog"
  on public.vehicles_catalog for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read routes_catalog" on public.routes_catalog;
create policy "Public read routes_catalog"
  on public.routes_catalog for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read site_config" on public.site_config;
create policy "Public read site_config"
  on public.site_config for select
  to anon, authenticated
  using (true);

-- ─── Storage: bucket admin-images ─────────────────────────
-- Bucket PÚBLICO en lectura (imágenes del panel admin). La escritura solo
-- funciona con service role: no se crean policies de INSERT/UPDATE/DELETE
-- para anon/authenticated en storage.objects.
insert into storage.buckets (id, name, public)
values ('admin-images', 'admin-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read admin-images" on storage.objects;
create policy "Public read admin-images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'admin-images');
