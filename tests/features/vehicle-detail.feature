#language: es
Feature: Ficha técnica de vehículo
  Como viajero evaluando una unidad
  Quiero ver todas las especificaciones, amenidades, fotos y disponibilidad
  Para decidir con información completa antes de solicitar una reserva

  Background:
    Dado que el vehículo "2024 Jayco Redhawk 26B" existe con internalCode "DC-C3-001"
    Y visito "/en/vehicles/2024-jayco-redhawk-26b"

  Escenario: Información principal
    Entonces veo el nombre, marca, año y tipo de vehículo
    Y veo el badge de estado de la unidad
    Y veo las métricas clave: capacidad para dormir, largo (métrico e imperial) y ubicación de pickup
    Y veo el precio por noche en CAD

  Escenario: Especificaciones técnicas completas
    Cuando hago scroll a la sección de especificaciones
    Entonces veo dimensiones (largo, ancho, altura exterior e interior, área, slide-outs)
    Y veo capacidad de tanques (agua limpia, grises, negras) en galones y litros
    Y veo datos de motor y chasis (chasis, motor, transmisión, rendimiento)
    Y veo las amenidades agrupadas por categoría (cocina, baño, dormitorio, clima, sistemas)
    Y veo los elementos de seguridad (detector de humo, CO, extintor, cámara de reversa)

  Escenario: Galería de imágenes
    Cuando hago click en una imagen de la galería
    Entonces se abre un lightbox navegable (←/→, Esc cierra, swipe táctil)
    Y el plano de planta (floorplan) es ampliable desde la galería

  Escenario: Calendario de disponibilidad
    Entonces veo el calendario de disponibilidad de la unidad con leyenda de estados
    Y los días ocupados muestran la fecha tentativa de disponibilidad

  Escenario: Widget de reserva
    Entonces veo el widget de reserva con selector de fechas
    Y al elegir fechas veo el desglose de precio en vivo (base × noches, km, seguro, extras, impuestos, total)

  Escenario: SEO
    Entonces la página tiene title, description y JSON-LD tipo Product con oferta en CAD
    Y existen hreflang hacia la versión FR de la ficha (/fr/vehicules/...)

  Escenario: Unidades similares
    Entonces veo hasta 3 unidades similares del mismo tipo

  Escenario (triste): Slug inexistente
    Cuando visito "/en/vehicles/no-existe"
    Entonces recibo un error 404

  Escenario (triste): Unidad ocupada
    Dado que la unidad está en estado OCCUPIED
    Entonces el widget muestra la próxima fecha disponible tentativa
    Y ofrezco el formulario "Notificarme cuando esté disponible"
