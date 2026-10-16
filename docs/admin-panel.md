# Panel de administración — Guía (ADR-020 + ADR-022)

El panel `/admin` permite mantener **trucks**, **rutas** y el **branding visual**
(nombre, logo, imagen panorámica del hero) sin tocar código. El panel escribe
directamente en **Supabase** (tablas `vehicles_catalog`, `routes_catalog` y
`site_config`, más el bucket de Storage `admin-images`) y, tras cada guardado
exitoso, dispara el **Deploy Hook de Vercel** para redesplegar el sitio en
**~30 s**. El panel **no usa GitHub**: no hay commits, PATs ni Contents API.

## 1. Variables de entorno (Vercel → Settings → Environment Variables)

Define estas variables en el entorno **Production** (y Preview si quieres probar):

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `ADMIN_TOKEN` | ✅ | Contraseña del panel. Genera una fuerte, p. ej. `openssl rand -hex 32`. |
| `PUBLIC_SUPABASE_URL` | ✅ | URL del proyecto Supabase (segura para el browser; va con prefijo `PUBLIC_`). |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key de Supabase. **Solo server** — nunca la prefixes con `PUBLIC_`. |
| `VERCEL_DEPLOY_HOOK` | Recomendada | URL del Deploy Hook que redespliega el sitio tras cada guardado. Sin ella, los cambios se guardan en la DB pero no se publican automáticamente. |

> ⚠️ `ADMIN_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY` son **solo server**. Nunca las
> prefixes con `PUBLIC_` (eso las expondría al browser).

### Crear el Deploy Hook

1. Vercel → tu proyecto → **Settings** → **Git**.
2. Sección **Deploy Hooks** → introduce un nombre (p. ej. `admin-panel`) y
   selecciona la rama **main** → **Create**.
3. Copia la URL generada y pégala como `VERCEL_DEPLOY_HOOK` en Vercel
   (Environment Variables).

## 2. Uso

1. Visita `https://<tu-dominio>/admin`.
2. Introduce el `ADMIN_TOKEN`.
3. Pestañas:
   - **Configuración**: nombre del sitio, logo (icono del catálogo o imagen
     subida + color de fondo) e imagen panorámica del hero con control de
     opacidad. Vista previa en vivo. Las imágenes se suben al bucket
     `admin-images` y se guarda su **URL pública** en `site_config`.
   - **Trucks**: lista, crea (`+ Nuevo truck`) y edita. El formulario envía el
     objeto completo; el servidor lo valida con `vehicleSchema` (Zod) y solo
     guarda en `vehicles_catalog` si es válido. Se ocultan con **Visible = off**
     (no se borran).
   - **Rutas**: edita frontmatter (nombre, paradas con lat/lng, highlights) y
     cuerpo markdown, con pestañas **EN / FR** por idioma.
4. **Guardar** → el backend escribe en Supabase → dispara el Deploy Hook →
   Vercel redespliega → los cambios aparecen en producción en **~30 s**.

## 3. Cómo funciona por debajo

```
/admin (island React)
   │  fetch + Authorization: Bearer <ADMIN_TOKEN>
   ▼
/api/admin/*  ──►  validación Zod
                     │
                     ▼
              Supabase (vehicles_catalog, routes_catalog, site_config
                        + Storage bucket admin-images)
                     │  guardado OK
                     ▼
              Deploy Hook de Vercel
                     │
                     ▼
              build SSG: lee el catálogo de la DB
                     │
                     ▼
                 producción (~30 s)
```

- **Validación antes de publicar**: si un JSON de truck, un frontmatter de ruta
  o el `site_config` no cumple el schema, la API responde `400` y **no se
  escribe nada en la DB**.
- **Imágenes**: se suben al bucket `admin-images` de Supabase Storage y el
  panel guarda su **URL pública** (p. ej.
  `https://<proyecto>.supabase.co/storage/v1/object/public/admin-images/admin/2026-10/hero.webp`).
  Límite 1 MB por imagen.
- **Build fail-safe**: el build de Vercel lee el catálogo desde la DB; si la DB
  estuviera inaccesible, el build degrada a los archivos seed locales
  (`src/content`, `src/config`) en lugar de fallar.

## 4. Degradación graceful (ADR-014)

Si faltan las env vars o falla la base de datos, los endpoints responden con
errores claros y el sitio público **no se ve afectado**:

| Situación | Respuesta |
|-----------|-----------|
| Token inválido o ausente | `401 UNAUTHORIZED` — el panel muestra "Token inválido o expirado". |
| Sin `PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | `503 DATABASE_NOT_CONFIGURED` — el panel avisa: "Supabase no está configurado en el entorno. Define PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y VERCEL_DEPLOY_HOOK en Vercel." |
| Payload que no pasa el schema Zod | `400 VALIDATION_FAILED` con `details` — no se escribe nada. |
| Sin `VERCEL_DEPLOY_HOOK` (guardado OK) | `200` con `deploy: "skipped"` — el panel muestra la advertencia: los cambios **sí quedaron en la DB**, pero no se redesplegarán automáticamente hasta el próximo build. |

## 5. Operación

### Sembrar la base de datos

```bash
npm run seed:catalog
```

Este comando copia el catálogo de los archivos seed del repo a las tablas de
Supabase. Útil en el primer despliegue o para restaurar el catálogo.

### Fallback de build

Los archivos de `src/content` y `src/config` quedan como **fallback de build**:
si no hay DB configurada (o esta no responde), el build SSG usa esos archivos y
el sitio se publica con el contenido seed. Esto garantiza que `/admin` nunca
rompa la web pública.

## 6. Limitaciones conocidas

- **Un build por guardado**: cada pulsación de "Guardar" dispara un redespliegue
  completo; guardados en bloque disparan varios builds seguidos.
- **~30 s de latencia** entre el guardado y la aparición en producción.
- **Límite de 1 MB** en subida de imágenes (bucket Storage).
- **Sin rate limiting ni 2FA** (mitigable con Cloudflare Access u OAuth si
  crece).
- **Sin deshacer**: los guardados sobrescriben el registro actual en la DB.
