# language: es
Feature: Galería de fotos por truck en el panel admin
  Como operador del panel /admin
  Quiero subir y gestionar varias fotos por truck
  Para que los clientes vean el truck desde varios puntos de vista

  Background:
    Dado que el operador ha iniciado sesión en /admin con un ADMIN_TOKEN válido
    Y está en la pestaña "Trucks"
    Y ha abierto el formulario de edición de un truck existente

  # ─── HAPPYPATH ─────────────────────────────────────────────
  Scenario: Subir varias fotos a la galería
    Dado que la galería del truck tiene 2 fotos
    Cuando selecciona 3 imágenes nuevas en la sección "Galería"
    Entonces las 3 imágenes se suben al bucket admin-images
    Y aparecen añadidas a la galería con categoría "EXTERIOR" por defecto
    Y la galería pasa a tener 5 fotos

  Scenario: Editar categoría y textos alternativos de una foto
    Dado que la galería tiene al menos una foto con categoría "EXTERIOR"
    Cuando cambia la categoría de esa foto a "KITCHEN"
    Y edita su texto alternativo (alt) y su texto alternativo en francés (altFr)
    Y guarda el truck
    Entonces la foto conserva la nueva categoría y los textos editados

  Scenario: Establecer una foto como imagen principal
    Dado que la galería tiene varias fotos
    Cuando pulsa "Hacer principal" en una foto de la galería
    Entonces el campo "Imagen principal" (mainImage) toma la URL de esa foto

  Scenario: Guardar la galería en Supabase
    Dado que la galería contiene las fotos deseadas
    Cuando pulsa "Guardar truck"
    Entonces el array images se envía completo al endpoint admin/vehicles
    Y el servidor valida cada foto con imageSchema antes de escribir
    Y se dispara el Deploy Hook para redesplegar el sitio

  # ─── SADPATH ───────────────────────────────────────────────
  Scenario: Exceder el límite de 12 fotos
    Dado que la galería del truck ya tiene 12 fotos
    Cuando intenta seleccionar imágenes adicionales
    Entonces se muestra el mensaje "Máximo 12 fotos por truck"
    Y no se sube ninguna imagen

  Scenario: Superar el límite parcialmente
    Dado que la galería del truck tiene 10 fotos
    Cuando selecciona 5 imágenes nuevas
    Entonces solo se suben las primeras 2 fotos para alcanzar el límite de 12
    Y se avisa al operador de que se ignoraron las restantes

  Scenario: Error al subir una imagen
    Dado que la galería tiene 3 fotos
    Cuando la subida de una imagen falla (por red o tamaño)
    Entonces se muestra un mensaje de error claro
    Y las fotos ya subidas en esa tanda no se pierden

  Scenario: Eliminar una foto de la galería
    Dado que la galería tiene 4 fotos
    Cuando elimina la segunda foto
    Entonces la galería queda con 3 fotos
    Y el orden (sortOrder) se recalcula de forma consecutiva
