#language: es
Feature: Calendario de disponibilidad
  Como usuario reservando
  Quiero ver en un calendario qué días está libre cada unidad
  Para elegir fechas correctas antes de solicitar la reserva

  Background:
    Dado que el vehículo "DC-C3-001" tiene bloques de disponibilidad registrados en Supabase
    Y el endpoint "GET /api/availability" expone los días del calendario

  Escenario: Días con estados correctos
    Cuando el calendario carga el mes actual y el siguiente
    Entonces cada día muestra un estado: available, occupied, maintenance o past
    Y los días pasados no son seleccionables
    Y los días ocupados se muestran en rojo y los de mantenimiento en amarillo

  Escenario: Selección de rango de fechas
    Cuando hago click en un día disponible (inicio)
    Y hago click en un día disponible posterior (fin)
    Entonces el rango completo se resalta
    Y se notifica al widget de reserva con las fechas inicio y fin

  Escenario: Navegación de meses
    Cuando navego al mes siguiente o anterior
    Entonces se solicitan los días al endpoint y se actualiza la grilla
    Y la leyenda de estados permanece visible

  Escenario: Unidad ocupada muestra próxima disponibilidad
    Dado que todos los días del rango consultado están ocupados
    Entonces se muestra "Ocupada hasta el [fecha]" con la fecha tentativa

  Escenario: Accesibilidad
    Entonces el calendario tiene aria-label, navegación por teclado y aria-live para estados de carga

  Escenario (triste): Parámetros inválidos
    Cuando el endpoint recibe "vehicleId" vacío o month fuera de 1-12
    Entonces responde con error 400

  Escenario (triste): Base de datos no configurada (entorno sin Supabase)
    Dado que las variables de Supabase no están configuradas
    Cuando el calendario consulta disponibilidad
    Entonces el endpoint responde con todos los días "available" (degradación graceful)
    Y la reserva no falla silenciosamente: el POST de reserva responde 503 con mensaje claro
