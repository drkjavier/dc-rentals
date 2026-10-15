# language: es
Feature: Panel de administración de contenido (trucks, rutas y config visual)
  Como operador de DC Rentals
  Quiero un panel web autenticado para mantener trucks, rutas, logo e imagen hero
  Para publicar cambios en producción sin editar código manualmente

  Background:
    Dado que el sitio es SSG (Astro) y el contenido vive en src/content/
    Y el sitio desplegado es dc-rentals-app (Vercel redespliega al recibir commits en main)
    Y el panel debe validar todo con Zod antes de commitear

  @happy-path
  Escenario: Login con token de administrador
    Dado que visito /admin
    Cuando introduzco el ADMIN_TOKEN configurado en Vercel
    Entonces accedo al panel con las secciones Configuración, Trucks y Rutas
    Y el token se guarda solo en sessionStorage (nunca en el servidor)

  @happy-path
  Escenario: Cambiar la imagen del hero y el logo
    Dado que estoy autenticado en Configuración del sitio
    Cuando subo una nueva imagen de hero y una imagen de logo
    Entonces los archivos se guardan en public/images/ vía la API de GitHub
    Y el src/config/site-config.json se actualiza con las nuevas rutas
    Y Vercel redespliega y el hero/logo nuevos aparecen en producción

  @happy-path
  Escenario: Crear un truck nuevo
    Dado que estoy en la sección Trucks
    Cuando relleno el formulario (código, nombre, tipo, precios, specs) y guardo
    Entonces se valida contra vehicleSchema (Zod)
    Y se crea src/content/vehicles/<codigo>.json vía API de GitHub
    Y el truck aparece en /en/vehicles tras el redespliegue (~30 s)

  @happy-path
  Escenario: Editar una ruta existente
    Dado que estoy en la sección Rutas
    Cuando modifico nombre, paradas (stops) o cuerpo markdown de una ruta
    Entonces se valida contra routeSchema (Zod)
    Y se actualizan los archivos .en.mdx y .fr.mdx vía API de GitHub

  @happy-path
  Escenario: Desactivar un truck sin borrarlo
    Cuando pongo active=false en un truck y guardo
    Entonces el truck deja de mostrarse en el catálogo pero el archivo permanece

  @sad-path
  Escenario: Datos inválidos no se commitean
    Dado que envío un JSON de truck que incumple vehicleSchema
    Cuando el endpoint POST /api/admin/vehicles lo valida
    Entonces responde 400 con los errores de Zod
    Y NO se realiza ningún commit en GitHub

  @sad-path
  Escenario: Sin token de acceso
    Cuando llamo a cualquier endpoint /api/admin/* sin Authorization válida
    Entonces responde 401 y no ejecuta ninguna operación

  @sad-path
  Escenario: Sin configuración de GitHub
    Dado que GITHUB_TOKEN / GITHUB_REPO no están definidos en el entorno
    Cuando intento guardar cambios
    Entonces responde 503 con mensaje claro (degradación graceful, estilo ADR-014)

  @sad-path
  Escenario: Archivo demasiado grande para subir
    Cuando subo una imagen mayor a 1 MB (límite de la API de contenidos de GitHub)
    Entonces responde 413 con mensaje claro y sugiere comprimir la imagen
