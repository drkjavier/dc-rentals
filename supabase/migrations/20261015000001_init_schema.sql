-- supabase/schema.sql — SDD: TECHNICAL-SPEC.md §4.2
-- Ejecutar en el SQL Editor de Supabase (plan Free).

-- ─── Enums ───────────────────────────────────────────────
-- Nota (ADR-021): `create type if not exists ... as enum` NO es SQL válido
-- en PostgreSQL (CREATE TYPE no acepta IF NOT EXISTS). Se usa el patrón
-- idempotente DO + exception duplicate_object.
do $$ begin
  create type availability_block_type as enum
    ('RESERVATION', 'MAINTENANCE', 'BLOCKED', 'COMING_SOON');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reservation_status as enum
    ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
exception when duplicate_object then null;
end $$;

-- ─── availability_blocks ─────────────────────────────────
-- Nota: vehicle_id guarda el internalCode del vehículo en Content Collections
-- (ej. "DC-C3-001"), no una FK relacional, porque el catálogo vive en archivos.
create table if not exists public.availability_blocks (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  text not null,
  start_date  date not null,
  end_date    date not null,
  type        availability_block_type not null default 'RESERVATION',
  reason      text,
  created_at  timestamptz not null default now(),
  constraint valid_range check (end_date >= start_date)
);

create index if not exists idx_blocks_vehicle_dates
  on public.availability_blocks (vehicle_id, start_date, end_date);

-- ─── reservation_requests ────────────────────────────────
-- Solicitud de reserva SIN PAGO. Se confirma manualmente (dashboard/SQL).
-- price_snapshot congela el PriceBreakdown calculado al momento de solicitar.
create table if not exists public.reservation_requests (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     text not null,
  start_date     date not null,
  end_date       date not null,
  nights         int not null,
  km_package     text,
  extras         jsonb default '[]'::jsonb,
  delivery_address text,
  price_snapshot jsonb not null,
  status         reservation_status not null default 'PENDING',
  -- Info del huésped
  guest_name     text not null,
  guest_email    text not null,
  guest_phone    text,
  guest_province text,
  guest_country  text not null default 'CA',
  license_type   text,
  driver_age     int,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint valid_dates check (end_date > start_date)
);

create index if not exists idx_requests_status on public.reservation_requests (status);
create index if not exists idx_requests_email on public.reservation_requests (guest_email);
create index if not exists idx_requests_dates on public.reservation_requests (vehicle_id, start_date, end_date);

-- ─── notification_subscriptions ──────────────────────────
create table if not exists public.notification_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  email      text not null,
  phone      text,
  triggered  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (vehicle_id, email)
);

-- ─── Row Level Security ──────────────────────────────────
alter table public.availability_blocks enable row level security;
alter table public.reservation_requests enable row level security;
alter table public.notification_subscriptions enable row level security;

-- Lectura pública de disponibilidad (necesaria para el calendario en browser)
drop policy if exists "Public read availability" on public.availability_blocks;
create policy "Public read availability"
  on public.availability_blocks for select
  using (true);

-- Solicitudes de reserva: nadie las lee ni escribe desde el browser.
-- Solo el server endpoint usa la service role key (bypass RLS).
-- Si en el futuro se quiere insertar desde browser, crear policy de INSERT con
-- validación de campos; en el MVP NO se permite.

-- ─── Confirmación manual de reservas (MVP) — ver §4.2 ────
-- update public.reservation_requests set status = 'CONFIRMED', updated_at = now() where id = '<request-id>';
-- insert into public.availability_blocks (vehicle_id, start_date, end_date, type, reason)
--   select vehicle_id, start_date, end_date, 'RESERVATION', 'Confirmed request'
--   from public.reservation_requests where id = '<request-id>';
