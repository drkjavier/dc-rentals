#language: es
Feature: Solicitud de reserva sin pago (MVP)
  Como viajero que eligió unidad y fechas
  Quiero enviar una solicitud de reserva sin pagar en línea
  Para recibir confirmación del operador en menos de 24 horas

  Background:
    Dado que el vehículo "DC-C3-001" existe y está disponible en las fechas elegidas
    Y el endpoint "POST /api/reservations" recibe la solicitud
    Y NO hay módulo de pagos (feature flag PUBLIC_ENABLE_PAYMENTS=false)

  Escenario: Solicitud válida (happy path)
    Cuando envío una solicitud con vehículo, fechas (5 noches), nombre, email y edad del conductor (>=21)
    Entonces el sistema valida los campos con Zod
    Y verifica la disponibilidad del rango en el servidor (doble check)
    Y calcula y congela el precio en price_snapshot
    Y crea la solicitud con estado PENDING
    Y responde 201 con el id de la solicitud y mensaje de acuse
    Y si RESEND_API_KEY está configurado envía email de acuse; si no, solo registra en BD

  Escenario: Desglose de precio congelado
    Dado que la solicitud incluye paquete de kilometraje "standard" y extra "linen-kit"
    Entonces el price_snapshot incluye noches, tarifa base, km package, seguro, extras, subtotal, impuesto (según provincia) y total en CAD
    Y el depósito de seguridad aparece como informativo (se paga al recoger)

  Escenario: Email inválido
    Cuando envío la solicitud con guestEmail "no-es-email"
    Entonces responde 400 con detalle de validación

  Escenario: Edad del conductor insuficiente
    Cuando envío la solicitud con driverAge 18
    Entonces responde 400

  Escenario: Rango de fechas inválido
    Cuando envío endDate anterior o igual a startDate
    Entonces responde 400

  Escenario: Conflicto de fechas (unidad reservada entre medias)
    Dado que existe un availability_block que solapa el rango solicitado
    Cuando envío la solicitud
    Entonces responde 409 con código DATE_CONFLICT
    Y no se crea ninguna solicitud

  Escenario: Vehículo inexistente
    Cuando envío la solicitud con vehicleId "DC-XX-999"
    Entonces responde 404

  Escenario (triste): Sin configuración de Supabase
    Dado que las variables de Supabase no están configuradas
    Cuando envío la solicitud
    Entonces responde 503 con código DATABASE_NOT_CONFIGURED
    Y el mensaje indica que la reserva no está disponible temporalmente
