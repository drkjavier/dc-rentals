# Panel de administración — Guía de configuración (ADR-020)

El panel `/admin` permite mantener **trucks**, **rutas** y el **branding visual**
(nombre, logo, imagen panorámica del hero) sin tocar código. Los cambios se
publican automáticamente: el panel commitea a `main` y **Vercel redespliega en
~30 s**.

## 1. Variables de entorno (Vercel → Settings → Environment Variables)

Define estas variables en el entorno **Production** (y Preview si quieres probar):

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `ADMIN_TOKEN` | ✅ | Contraseña del panel. Genera una fuerte, p. ej. `openssl rand -hex 32`. |
| `GITHUB_TOKEN` | ✅ | Personal Access Token de GitHub con scope **`repo`** (o `contents:write` en orgs). Se usa para leer/escribir archivos vía Contents API. |
| `GITHUB_REPO` | ✅ | Repo desplegado, formato `owner/name` — p. ej. `drkjavier/dc-rentals-app`. |
| `GITHUB_BRANCH` | — | Rama destino (default `main`). |

> ⚠️ `GITHUB_TOKEN` y `ADMIN_TOKEN` son **solo server**. Nunca las prefixes con
> `PUBLIC_` (eso las expondría al browser).

### Crear el token de GitHub
1. GitHub → Settings → Developer settings → **Personal access tokens** → Fine-grained.
2. Repositorio limitado a `dc-rentals-app`, permisos: **Contents: Read and write**.
3. Copia el token y pégalo como `GITHUB_TOKEN` en Vercel.

## 2. Uso

1. Visita `https://<tu-dominio>/admin`.
2. Introduce el `ADMIN_TOKEN`.
3. Pestañas:
   - **Configuración**: nombre del sitio, logo (icono del catálogo o imagen
     subida + color de fondo) e imagen panorámica del hero con control de
     opacidad. Vista previa en vivo.
   - **Trucks**: lista, crea (`+ Nuevo truck`) y edita. El formulario envía el
     objeto completo; el servidor lo valida con `vehicleSchema` (Zod) y solo
     commitea si es válido. Se ocultan con **Visible = off** (no se borran).
   - **Rutas**: edita frontmatter (nombre, paradas con lat/lng, highlights) y
     cuerpo markdown, con pestañas **EN / FR** por idioma.
4. **Guardar** → el panel commitea → Vercel redespliega → los cambios aparecen
   en producción en ~30 s.

## 3. Cómo funciona por debajo

```
/admin (island React)
   │  fetch + Authorization: Bearer <ADMIN_TOKEN>
   ▼
src/pages/api/admin/*  ── Zod validate ──►  GitHub Contents API
                                               │  commit a main
                                               ▼
                                        Vercel detecta push → build → prod
```

- **Validación antes de publicar**: si un JSON de truck o un frontmatter de ruta
  no cumple el schema, la API responde `400` y **no se hace ningún commit**.
- Si el `site-config.json` quedara inválido, el **build de Vercel fallaría** antes
  de publicar (fail-safe).
- **Imágenes**: se suben a `public/images/admin/<AAAA-MM>/<nombre>` y se sirven
  como assets estáticos. Límite 1 MB por imagen.

## 4. Degradación graceful (ADR-014)

Si faltan las env vars, los endpoints responden con errores claros y el sitio
público **no se ve afectado**:

| Situación | Respuesta |
|-----------|-----------|
| Sin `ADMIN_TOKEN` | `503 ADMIN_NOT_CONFIGURED` |
| Token inválido | `401 UNAUTHORIZED` |
| Sin `GITHUB_TOKEN`/`GITHUB_REPO` | `503 GITHUB_NOT_CONFIGURED` |

## 5. Limitaciones conocidas

- Sin rate limiting ni 2FA (mitigable con Cloudflare Access u OAuth si crece).
- Subida de imágenes limitada a 1 MB (límite de la GitHub Contents API).
- Los commits van directos a `main` (sin PR); el historial queda en GitHub.
