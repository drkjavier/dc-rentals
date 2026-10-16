-- supabase/seed.sql — Datos iniciales de disponibilidad (demo)
-- Los internalCode deben coincidir con src/content/vehicles/*.json.

-- DC-TT-003 está en estado OCCUPIED: bloque activo hasta el 2026-08-15
insert into public.availability_blocks (vehicle_id, start_date, end_date, type, reason)
values ('DC-TT-003', '2026-07-01', '2026-08-15', 'RESERVATION', 'Current rental (seed)')
on conflict do nothing;

-- DC-C3-001: bloqueo de mantenimiento breve de demostración
insert into public.availability_blocks (vehicle_id, start_date, end_date, type, reason)
values ('DC-C3-001', '2026-09-07', '2026-09-09', 'MAINTENANCE', 'Deep cleaning (seed)')
on conflict do nothing;

-- DC-CA-004 llega a la flota: bloque COMING_SOON hasta su activación
insert into public.availability_blocks (vehicle_id, start_date, end_date, type, reason)
values ('DC-CA-004', '2026-06-01', '2026-06-20', 'COMING_SOON', 'Fleet onboarding (seed)')
on conflict do nothing;
