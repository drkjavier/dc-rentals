#language: es
Feature: Catálogo de flota con filtros y ordenamiento
  Como viajero buscando un RV
  Quiero filtrar y ordenar la flota por tipo, capacidad, precio y ubicación
  Para encontrar la unidad que mejor se adapta a mi viaje

  Background:
    Dado que el catálogo contiene vehículos de tipos CLASS_A, CLASS_B, CLASS_C y TRAVEL_TRAILER
    Y visito "/en/vehicles"

  Escenario: Listado completo
    Entonces veo una tarjeta por cada vehículo activo del catálogo
    Y cada tarjeta muestra imagen, nombre, tipo, capacidad para dormir, largo y precio por noche en CAD

  Escenario: Filtrar por tipo de vehículo
    Cuando selecciono el filtro de tipo "CLASS_C"
    Entonces solo se muestran vehículos CLASS_C

  Escenario: Filtrar por capacidad y mascotas
    Cuando selecciono sleepCapacity "6" y petFriendly "true"
    Entonces solo se muestran vehículos que duermen 6 y aceptan mascotas

  Escenario: Ordenar por precio ascendente
    Cuando selecciono orden "price_asc"
    Entonces las tarjetas se ordenan de menor a mayor precio por noche

  Escenario: Resultado vacío
    Cuando selecciono filtros sin resultados (tipo CLASS_A + sleepCapacity 2)
    Entonces veo un estado vacío amigable con opción de limpiar filtros
    Y no se muestra ninguna tarjeta

  Escenario: Catálogo en francés
    Cuando visito "/fr/vehicules"
    Entonces las etiquetas de filtros y tarjetas están en francés

  Escenario (triste): Datos de imagen faltantes
    Dado un vehículo cuya imagen principal no existe en disco
    Entonces la página sigue renderizando sin romperse (alt text presente, sin crash)
