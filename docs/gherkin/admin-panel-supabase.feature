# language: es
Feature: Panel de administración sobre Supabase (ADR-022)
  Como operador de DC Rentals
  Quiero gestionar trucks, rutas y branding desde /admin usando Supabase
  Para mantener el contenido publicado sin depender de un Personal Access Token de GitHub

  Background:
    Dado que ADMIN_TOKEN está definido en el entorno de Vercel
    Y que PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY están definidas
    Y que el catálogo (vehicles, routes, site_config) existe en Supabase
    Y que el bucket público admin-images existe en Supabase Storage

  # ---------- HAPPYPATH ----------

  Scenario: Guardar site config escribe en Supabase y dispara el redespliegue
    Dado que estoy autenticado en /admin con un token válido
    Cuando envío un site-config válido mediante PUT /api/admin/site-config
    Entonces la tabla site_config queda actualizada con la config validada
    Y la respuesta incluye ok=true y deploy=triggered
    Y se hace un POST al Deploy Hook de Vercel

  Scenario: Editar un truck actualiza la tabla vehicles
    Dado que existe un truck con internalCode "DC-C3-001"
    Cuando envío su objeto completo mediante PUT /api/admin/vehicles/DC-C3-001
    Entonces la fila correspondiente en vehicles_catalog queda actualizada
    Y la respuesta incluye ok=true y deploy=triggered

  Scenario: Crear un truck nuevo no pisa uno existente
    Dado que NO existe un truck con internalCode "DC-CB-005"
    Cuando envío un truck válido con ese internalCode mediante POST /api/admin/vehicles
    Entonces se inserta una fila nueva en vehicles_catalog
    Y la respuesta tiene estado 201

  Scenario: Editar una ruta EN y FR actualiza ambas filas
    Dado que existe la ruta "rocky-mountains" en inglés y francés
    Cuando envío los datos EN y FR mediante PUT /api/admin/routes/rocky-mountains
    Entonces las filas (rocky-mountains, en) y (rocky-mountains, fr) quedan actualizadas
    Y la respuesta incluye ok=true y deploy=triggered

  Scenario: Subir imagen usa Supabase Storage
    Dado que estoy autenticado en /admin con un token válido
    Cuando envío una imagen válida en base64 mediante POST /api/admin/upload
    Entonces el archivo se guarda en el bucket admin-images bajo admin/<AAAA-MM>/
    Y la respuesta incluye la URL pública de la imagen
    Y el límite de 1 MB sigue aplicando

  Scenario: El build lee el catálogo desde Supabase cuando está configurado
    Dado que las variables de Supabase están definidas en el entorno de build
    Cuando se ejecuta astro build
    Entonces los trucks y rutas se leen de Supabase
    Y la FAQ se sigue leyendo de Content Collections

  Scenario: El build usa los archivos seed como fallback sin Supabase
    Dado que NO hay variables de Supabase en el entorno de build
    Cuando se ejecuta astro build
    Entonces los trucks y rutas se leen de los archivos seed del repo
    Y el build termina correctamente

  # ---------- SADPATH ----------

  Scenario: Sin Supabase configurado el panel no puede guardar
    Dado que falta SUPABASE_SERVICE_ROLE_KEY en el entorno
    Cuando envío un site-config válido mediante PUT /api/admin/site-config
    Entonces la respuesta tiene estado 503 con error DATABASE_NOT_CONFIGURED

  Scenario: Datos inválidos no se escriben ni disparan deploy
    Dado que estoy autenticado en /admin con un token válido
    Cuando envío un truck con campos faltantes mediante POST /api/admin/vehicles
    Entonces la respuesta tiene estado 400 con error VALIDATION_FAILED
    Y no se modifica vehicles_catalog
    Y no se dispara el Deploy Hook

  Scenario: Sin VERCEL_DEPLOY_HOOK el guardado funciona con advertencia
    Dado que falta VERCEL_DEPLOY_HOOK en el entorno
    Cuando guardo un truck válido
    Entonces la escritura en Supabase se completa correctamente
    Y la respuesta incluye deploy=skipped

  Scenario: Token de admin inválido sigue rechazado
    Dado que envío un Authorization bearer inválido
    Cuando llamo a cualquier endpoint /api/admin/*
    Entonces la respuesta tiene estado 401 con error UNAUTHORIZED

  Scenario: GITHUB_TOKEN ya no es necesario
    Dado que no existen GITHUB_TOKEN ni GITHUB_REPO en el entorno
    Cuando me autentico en /admin
    Entonces el panel funciona sin mostrar errores de configuración de GitHub
