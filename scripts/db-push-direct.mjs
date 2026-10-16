// scripts/db-push-direct.mjs — Aplica las migraciones de supabase/migrations/
// contra una BD PostgreSQL vía conexión directa (DATABASE_URL).
//
// ADR-021: alternativa a `npm run db:push` (CLI) para cuando no hay login de
// Supabase disponible. Usa la misma fuente de verdad (supabase/migrations/),
// las aplica en orden y las registra en `public.schema_migrations` para no
// re-ejecutarlas.
//
// Uso:
//   DATABASE_URL='postgresql://...' node scripts/db-push-direct.mjs
//
// Seguridad: DATABASE_URL solo via env var (nunca se escribe en el repo).
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations"
);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("✗ Falta DATABASE_URL (env var). Ejemplo:");
  console.error("  DATABASE_URL='postgresql://...' node scripts/db-push-direct.mjs");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requiere SSL
});

async function main() {
  await client.connect();
  console.log("✓ Conectado a la BD\n");

  // Tabla de tracking (estándar de muchas herramientas de migración)
  await client.query(`
    create table if not exists public.schema_migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows: appliedRows } = await client.query(
    "select name from public.schema_migrations"
  );
  const applied = new Set(appliedRows.map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort(); // orden lexicográfico = cronológico por timestamp

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    console.log("✓ Sin migraciones pendientes. BD al día.");
    await client.end();
    return;
  }

  console.log(`Migraciones pendientes (${pending.length}/${files.length}):\n`);

  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf-8");
    process.stdout.write(`  → ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (name) values ($1)",
        [file]
      );
      await client.query("commit");
      console.log("✓");
    } catch (err) {
      await client.query("rollback");
      console.log("✗");
      console.error(`\n✗ Error aplicando ${file}:`);
      console.error(`  ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log(`\n✓ ${pending.length} migración(es) aplicada(s). BD lista.`);
  await client.end();
}

main().catch(async (err) => {
  console.error(`\n✗ Error de conexión/ejecución: ${err.message}`);
  try {
    await client.end();
  } catch {
    /* noop */
  }
  process.exit(1);
});
