# supabase/ — Migraciones de base de datos (ADR-021)

La **única fuente de verdad** del schema son las migraciones versionadas en
[`migrations/`](./migrations), aplicadas con la **Supabase CLI**. No hay un
`schema.sql` suelto: editar ahí crearía dos fuentes en conflicto.

## Comandos (npm)

```bash
npm run db:login    # una vez por máquina: autenticar con Supabase (browser)
npm run db:link     # una vez por proyecto: enlazar con el proyecto hosted
npm run db:push     # aplicar las migraciones pendientes a la BD remota
npm run db:status   # ver migraciones aplicadas vs locales
npm run db:reset    # SOLO local: recrea la BD y reaplica migraciones + seed
```

El `db:link` apunta al project ref `towodmbmszrsbirsjzdj` (proyecto DC Rentals).

## Cómo cambiar el schema (flujo correcto)

1. Crear una nueva migración (no editar las existentes):
   ```bash
   npx supabase migration new <descripcion_corta>
   ```
2. Escribir el SQL en el archivo generado en `migrations/<timestamp>_<desc>.sql`.
3. `npm run db:push` para aplicarla.

> Las migraciones son **append-only**: una vez aplicadas NO se editan. Los
> cambios se hacen con una migración nueva. (Consistente con AGENTS.md:
> "solo migraciones additive".)

## Migraciones existentes

| Archivo | Contenido |
|---------|-----------|
| `20261015000001_init_schema.sql` | Enums, tablas `availability_blocks`, `reservation_requests`, `notification_subscriptions`, índices y RLS. |
| `20261015000002_seed_demo.sql` | Datos de demostración de disponibilidad (bloques de ejemplo). |

## Claves de conexión (no en este repo)

La URL y las API keys viven en las env vars de Vercel (nunca en el código):
`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Ver `docs/admin-panel.md` y `.env.example`.
