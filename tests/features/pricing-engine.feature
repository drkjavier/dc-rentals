#language: es
Feature: Motor de precios (funciones puras)
  Como viajero y operador
  Quiero un cálculo de precio transparente y idéntico en preview (island) y en el servidor
  Para que el desglose mostrado coincida con el precio congelado en la solicitud

  Background:
    Dado que el motor de precios es una función pura compartida entre island y endpoint
    Y la tarifa base del vehículo es de 189 CAD/noche

  Escenario: Reserva básica de 5 noches en Alberta
    Dado un rango del 2026-08-15 al 2026-08-20 con paquete "standard" y seguro 25 CAD/día
    Entonces noches=5, base=945, km package=300, seguro=125
    Y subtotal=1370, impuesto GST 5% = 68.50, total=1438.50 CAD
    Y el redondeo tiene tolerancia de ±0.01

  Escenario: Impuestos por provincia
    Dada una reserva en Quebec
    Entonces el impuesto usa tasa 14.975% con label "GST + QST"
    Y en Ontario usa HST 13%
    Y provincia desconocida usa Alberta (GST 5%) como fallback

  Escenario: Extras con precio por día
    Dado el extra "wifi-hotspot" (10 CAD/día) por 3 noches
    Entonces el extra suma 30 CAD
    Y extras desconuidos se ignoran sin romper el cálculo

  Escenario: Tarifa estacional
    Dada una fecha en julio (temporada pico)
    Entonces el multiplicador aplicado es 1.35
    Y una fecha en enero aplica 0.75 (temporada baja)

  Escenario: Formato de moneda
    Dado un monto 1438.5
    Entonces se formatea como moneda CAD según locale ("en-CA" / "fr-CA")

  Escenario (triste): Fechas inválidas
    Dado un endDate igual a startDate
    Entonces noches se calcula como 0 y el total es solo impuestos sobre extras/seguro (sin base)
