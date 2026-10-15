# DC Rentals — Landing Page: Documento de Construcción

> **Propósito**: Este documento sirve como guía maestra para el diseño, desarrollo y lanzamiento de la landing page de DC Rentals, una plataforma de renta de casas rodantes (RV rentals) enfocada en el mercado canadiense, con arquitectura preparada para escalar a otros países.

---

## Índice

1. [Razón de Ser](#1-razón-de-ser)
2. [Contexto del Mercado Canadiense](#2-contexto-del-mercado-canadiense)
3. [Público Objetivo](#3-público-objetivo)
4. [Clasificación de Vehículos RV](#4-clasificación-de-vehículos-rv)
5. [Especificaciones Técnicas por Unidad](#5-especificaciones-técnicas-por-unidad)
6. [Funcionalidades de la Landing Page](#6-funcionalidades-de-la-landing-page)
7. [Sistema de Disponibilidad y Calendario](#7-sistema-de-disponibilidad-y-calendario)
8. [Ficha Técnica por Unidad](#8-ficha-técnica-por-unidad)
9. [Arquitectura Técnica](#9-arquitectura-técnica)
10. [Internacionalización (i18n) y Escalabilidad](#10-internacionalización-i18n-y-escalabilidad)
11. [Diseño UX/UI](#11-diseño-uxui)
12. [SEO y Rendimiento](#12-seo-y-rendimiento)
13. [Consideraciones Legales y Regulatorias (Canadá)](#13-consideraciones-legales-y-regulatorias-canadá)
14. [Modelo de Negocio y Pricing](#14-modelo-de-negocio-y-pricing)
15. [Roadmap de Desarrollo](#15-roadmap-de-desarrollo)

---

## 1. Razón de Ser

### ¿Qué es DC Rentals?

DC Rentals es una plataforma digital dedicada a la **renta de casas rodantes (Recreational Vehicles — RVs)** en Canadá. La landing page funciona como el punto de entrada principal para clientes potenciales que buscan alquilar un vehículo recreativo para sus vacaciones, road trips o escapadas de fin de semana.

### ¿Por qué existe?

El mercado de renta de RVs en Canadá está en crecimiento. Según la **Canadian Recreational Vehicle Association (CRVA)**, el interés por el RVing ha aumentado significativamente, con un 66% de las reservas en plataformas como Outdoorsy proveniendo de **arrendatarios primerizos**. Canadá cuenta con más de **2,920 parques RV y campamentos** (Statistics Canada, 2023) y más de **1,753 negocios de renta y leasing de RVs** a nivel nacional.

La razón de ser de esta landing page es:

- **Conectar** a viajeros con la flota de casas rodantes disponibles
- **Mostrar de forma clara** cada unidad con sus especificaciones técnicas, capacidad, estado de disponibilidad y fotografías
- **Facilitar la decisión de compra** proporcionando toda la información necesaria en un solo lugar
- **Generar reservas** mediante un flujo de booking intuitivo y transparente
- **Transmitir confianza** a través de reseñas, certificaciones y políticas claras

### Diferenciadores clave

| Diferenciador | Descripción |
|---|---|
| Enfoque canadiense | Contenido, regulaciones y rutas adaptadas a Canadá |
| Disponibilidad en tiempo real | Calendario visual con estado de cada unidad |
| Información técnica completa | Metros cuadrados, pies, capacidad, amenidades del interior |
| Transparencia de estado | Unidades ocupadas muestran fecha tentativa de disponibilidad |
| Bilingüismo | Sitio en inglés y francés (idiomas oficiales de Canadá) |
| Unidades métricas | Medidas en metros/pies (dual) para viajeros internacionales |

---

## 2. Contexto del Mercado Canadiense

### Panorama general

- **Temporada alta**: Mayo a Octubre (pico en Julio-Agosto)
- **Temporada baja**: Noviembre a Abril (algunos operadores ofrecen RVs adaptados para invierno)
- **Precios promedio**: $100 - $400 CAD/noche dependiendo del tamaño y temporada
- **Paquetes de kilometraje**: Comunes en Canadá (~$300 CAD por 800 km)
- **Seguro**: $15 - $35 CAD/día
- **Kit básico**: ~$100 CAD (propano, químicos para inodoros, mangueras)

### Principales competidores en Canadá

| Empresa | Tipo | Alcance |
|---|---|---|
| **CanaDream** | Flota propia | Nacional (Vancouver, Calgary, Toronto, Montreal, Halifax) |
| **Fraserway RV** | Flota propia | Nacional (7 ubicaciones: Vancouver, Calgary, Edmonton, Toronto, Montreal, Halifax, Whitehorse) |
| **Cruise Canada** | Flota propia | Nacional + USA |
| **RVezy** | Peer-to-peer | Nacional (plataforma marketplace) |
| **Outdoorsy** | Peer-to-peer | Nacional + USA |
| **Authentik Canada** | Agencia/planificación | Nacional (viajes organizados) |

### Rutas populares en Canadá

1. **Rocky Mountains** (Calgary → Banff → Jasper → Vancouver)
2. **Vancouver Island** (Victoria → Tofino → Pacific Rim)
3. **Quebec Maritime** (Montreal → Gaspésie → Îles-de-la-Madeleine)
4. **Cabot Trail** (Nova Scotia)
5. **Icefields Parkway** (Alberta)
6. **Okanagan Valley** (British Columbia)
7. **Yukon / Alaska Highway** (Whitehorse → Alaska)
8. **Great Lakes** (Ontario)
9. **Prince Edward Island**
10. **Fundy Trail** (New Brunswick)

### Regulaciones provinciales de licencias

| Provincia | Licencia básica requerida | Notas |
|---|---|---|
| **British Columbia** | Clase 5 | Incluye RVs de 2+ ejes; remolques < 4,600 kg |
| **Alberta** | Clase 5 | Sin frenos de aire en remolque |
| **Saskatchewan** | Clase 5 | Remolque < 4,500 kg |
| **Manitoba** | Clase 5 | Combinación < 4,540 kg |
| **Ontario** | Clase G | Nuevas enmiendas desde Julio 2025 |
| **Quebec** | Clase 5 | Estándar provincial |
| **New Brunswick** | Clase 5 | 2-3 ejes; remolque < 4,500 kg |
| **Nova Scotia** | Clase 5 | Vehículos < 10 pasajeros |
| **PEI** | Clase 5 | Vehículo < 14,000 kg; remolque < 4,500 kg |
| **Newfoundland** | Clase 5 | 2 ejes; remolque < 4,500 kg |
| **Yukon** | Clase 5 | Similar a Newfoundland |

> **Nota para escalabilidad**: En una futura expansión a USA, las regulaciones varían por estado. La arquitectura debe permitir configurar requisitos de licencia por jurisdicción.

---

## 3. Público Objetivo

### Segmentos principales

#### 3.1 Familias canadienses (primario)
- **Perfil**: Familias con hijos (2-6 miembros), 30-50 años
- **Motivación**: Vacaciones de verano, conexión con la naturaleza, experiencias compartidas
- **Duración típica**: 1-2 semanas
- **Presupuesto**: $1,500 - $4,000 CAD (renta + km + camping)
- **Prioridades**: Espacio, seguridad, comodidad para niños, facilidad de conducción
- **Tipo de RV preferido**: Class C (cama sobre cabina, ideal para familias)

#### 3.2 Parejas y aventureros (secundario)
- **Perfil**: Parejas 25-45 años, sin hijos o con hijos mayores
- **Motivación**: Road trips románticos, aventura, fotografía, desconexión
- **Duración típica**: 4 días - 3 semanas
- **Presupuesto**: $800 - $2,500 CAD
- **Prioridades**: Movilidad, eficiencia de combustible, acceso a áreas remotas
- **Tipo de RV preferido**: Class B (camper van) o Travel Trailer

#### 3.3 Turistas internacionales (terciario)
- **Perfil**: Viajeros de Europa, Asia, USA, 25-60 años
- **Motivación**: Explorar Canadá de forma independiente, naturaleza, fotografía
- **Duración típica**: 2-4 semanas
- **Presupuesto**: $3,000 - $8,000 CAD
- **Prioridades**: Información clara, proceso de reserva simple, soporte en múltiples idiomas
- **Tipo de RV preferido**: Class C o Class A (experiencia completa)

#### 3.4 Jubilados / Silver travelers (terciario)
- **Perfil**: 55-75 años, retiro activo, "snowbirds"
- **Motivación**: Viajes largos, clima cálido en invierno, lifestyle RV
- **Duración típica**: 2-8 semanas
- **Presupuesto**: $2,000 - $6,000 CAD
- **Prioridades**: Comodidad, accesibilidad, amenidades completas
- **Tipo de RV preferido**: Class A o Class B+ (más lujo y espacio)

### Necesidades comunes de todos los segmentos

- Ver disponibilidad real antes de reservar
- Conocer las dimensiones exactas (largo, ancho, alto interior)
- Entender qué incluye la renta vs. qué es costo adicional
- Ver fotos reales del interior (no solo renders)
- Saber si la unidad está disponible o cuándo lo estará
- Poder comparar unidades lado a lado
- Reservar de forma segura y sencilla

---

## 4. Clasificación de Vehículos RV

### Tipos de RV que maneja DC Rentals

La flota puede incluir los siguientes tipos, clasificados según estándares de la industria canadiense (CRVA):

#### 4.1 Class A Motorhome (Autobús)
- **Descripción**: Los más grandes y lujosos, con aspecto de autobús. Chasis de camión comercial pesado.
- **Largo**: 6.4 - 12.2 m (21 - 40 ft)
- **Capacidad**: Hasta 6 personas
- **Rango de precio compra**: $70,000 - $500,000 CAD
- **Ideal para**: Familias grandes, grupos, viajes largos, experiencia premium
- **Dificultad de conducción**: Alta (8/10)
- **Combustible**: 6-10 MPG (gasolina); diesel algo mejor
- **Espacio interior**: 280 - 410 sq ft con slide-outs
- **Altura interior**: 1.83 - 1.93 m (6'0" - 6'4")

#### 4.2 Class B Motorhome (Camper Van)
- **Descripción**: Los más compactos, basados en chasis de van. Fáciles de conducir y estacionar.
- **Largo**: 4.9 - 6.4 m (16 - 21 ft)
- **Capacidad**: Hasta 4 personas
- **Rango de precio compra**: $60,000 - $160,000 CAD
- **Ideal para**: Parejas, aventureros solos, escapadas cortas
- **Dificultad de conducción**: Baja (2/10)
- **Combustible**: 14-18 MPG (el más eficiente)
- **Espacio interior**: ~72 sq ft
- **Altura interior**: 1.83 - 1.98 m (6'0" - 6'6")

#### 4.3 Class C Motorhome (Mediano)
- **Descripción**: Punto medio entre Class A y B. Identificable por la cama sobre la cabina (cabover bunk).
- **Largo**: 6.4 - 10.7 m (21 - 35 ft)
- **Capacidad**: Hasta 8 personas
- **Rango de precio compra**: $60,000 - $200,000 CAD
- **Ideal para**: Familias (el más popular: 67% de primeras rentas familiares lo eligen)
- **Dificultad de conducción**: Media (5/10)
- **Combustible**: 8-12 MPG
- **Espacio interior**: 200 - 350 sq ft
- **Altura interior**: 1.93 - 2.03 m (6'4" - 6'8")

#### 4.4 Travel Trailer (Remolque de viaje)
- **Descripción**: Remolques que se enganchan a un vehículo con capacidad de remolque. No tienen motor propio.
- **Largo**: 3.6 - 10.7 m (12 - 35 ft)
- **Capacidad**: Hasta 10 personas
- **Rango de precio compra**: $12,000 - $100,000 CAD
- **Ideal para**: Familias que ya tienen camioneta, campamentos fijos
- **Dificultad de remolque**: Media (6/10)
- **Combustible**: Depende del vehículo remolcador

#### 4.5 Fifth Wheel (Quinta Rueda)
- **Descripción**: Similar al travel trailer pero con sistema de enganche gooseneck en la cama de una pickup.
- **Largo**: 6.4 - 12.2 m (21 - 40 ft)
- **Capacidad**: Hasta 8 personas
- **Rango de precio compra**: $20,000 - $160,000 CAD
- **Ideal para**: Estancias largas, familias, viajeros experimentados

#### 4.6 Truck Camper (Camper de camioneta)
- **Descripción**: Unidad que se monta sobre la cama de una pickup truck.
- **Largo**: 3.6 - 6.0 m (12 - 20 ft)
- **Capacidad**: Hasta 4 personas
- **Rango de precio compra**: $15,000 - $75,000 CAD
- **Ideal para**: Aventureros off-road, parejas, acceso a terrenos difíciles

#### 4.7 Camper Van Conversion
- **Descripción**: Vans convertidas (Sprinter, Transit, ProMaster) con instalaciones básicas.
- **Largo**: 5.5 - 7.0 m (18 - 23 ft)
- **Capacidad**: 2-4 personas
- **Ideal para**: Van life, parejas, viajeros minimalistas

---

## 5. Especificaciones Técnicas por Unidad

### Campos obligatorios para cada unidad del catálogo

Cada RV en la landing page debe mostrar la siguiente información técnica:

#### 5.1 Identificación
| Campo | Ejemplo | Unidad |
|---|---|---|
| Nombre/Modelo | "2024 Jayco Redhawk 26B" | — |
| Marca | Jayco | — |
| Año | 2024 | — |
| Tipo | Class C Motorhome | — |
| ID interno | DC-C3-001 | — |

#### 5.2 Dimensiones
| Campo | Ejemplo (métrico) | Ejemplo (imperial) |
|---|---|---|
| Largo exterior | 8.13 m | 26 ft 8 in |
| Ancho exterior | 2.57 m | 101 in |
| Altura exterior (con A/C) | 3.66 m | 12 ft |
| Altura interior | 2.03 m | 6 ft 8 in |
| Ancho interior | 2.53 m | 99.5 in |
| Área interior aprox. | 23.2 m² | 250 sq ft |
| Slide-outs | 1 | — |
| Longitud de toldo (awning) | 4.88 m | 16 ft |

#### 5.3 Capacidad
| Campo | Ejemplo |
|---|---|
| Capacidad para dormir | 6 personas |
| Cinturones de seguridad | 6 |
| Capacidad de tanque de agua limpia | 76 gal (288 L) |
| Capacidad de tanque de aguas grises | 42 gal (159 L) |
| Capacidad de tanque de aguas negras | 32 gal (121 L) |
| Capacidad de combustible | 55 gal (208 L) |
| Peso GVWR | 5,443 kg (12,000 lbs) |
| Capacidad de remolque | 2,268 kg (5,000 lbs) |

#### 5.4 Motor y chasis
| Campo | Ejemplo |
|---|---|
| Chasis | Ford E-450 |
| Motor | 7.3L V8 Gasolina |
| Transmisión | Automática 10 velocidades |
| Rendimiento de combustible | 8-12 MPG (29-19 L/100km) |
| Generador | 4,000W (incluido) |
| Capacidad del generador | 4 horas/día incluidas |

#### 5.5 Interior — Distribución y amenidades

Para cada unidad se debe mostrar un **plano de planta** (floor plan) y detallar:

**Cocina:**
- Tipo de refrigerador (residencial 10 cu ft / RV 8 cu ft)
- Estufa (3 quemadores con horno / 2 quemadores)
- Microondas
- Horno de convección (opcional)
- Lavadero (doble/simple)
- Mesón de cocina (superficie sólida / laminado)
- Alacenas y almacenamiento

**Baño:**
- Tipo ( completo con ducha / medio baño / ducha exterior)
- Inodoro (porcelana / cassette)
- Ducha (con puerta de vidrio / cortina)
- Lavamanos
- Ventilación

**Dormitorio:**
- Cama principal (King 72"x80" / Queen 60"x80" / Full)
- Tipo de colchón (memory foam / estándar)
- Cama sobre cabina (cabover) — Class C
- Sofa cama (pull-out / jackknife)
- Mesa comedor convertible (dinette)
- Camas individuales (bunk beds) — para familias
- Puerta de privacidad
- Roperos y almacenamiento

**Sala / Estar:**
- TV (pulgadas y tipo)
- Sistema de sonido / Bluetooth
- Asientos reclinables (theater seating)
- Chimenea eléctrica (opcional)
- Mesas

**Clima y sistemas:**
- Aire acondicionado (13,500 BTU / 15,000 BTU)
- Calefacción (propano / eléctrica)
- Calentador de agua (tanque / tankless)
- Sistema eléctrico (30 amp / 50 amp)
- Paneles solares (opcional)
- Baterías de litio (capacidad en Ah)

#### 5.6 Exterior
| Campo | Descripción |
|---|---|
| Toldo (awning) | Manual / eléctrico, largo |
| Ducha exterior | Sí / No |
| Parrilla exterior | Sí / No (incluida o alquiler) |
| Cámara de reversa | Sí / No |
| Bicicletarack | Sí / No |
| Almacenamiento exterior | Capacidad en cu ft |
| Estabilizadores / niveladores | Manuales / eléctricos |
| Conexión para remolque | Capacidad en lbs |

#### 5.7 Seguridad
- Detector de humo
- Detector de CO (monóxido de carbono)
- Extintor de fuego
- Kit de primeros auxilios
- Kit de asistencia en carretera
- Cámara de reversa
- Linterna de emergencia

---

## 6. Funcionalidades de la Landing Page

### 6.1 Secciones de la página

#### Hero Section
- Imagen/video de fondo de alta calidad (paisaje canadiense con RV)
- Headline principal: propuesta de valor clara
- CTA principal: "Ver Flota Disponible" / "Reserva tu RV"
- Contador de unidades disponibles en tiempo real
- Selector rápido de fechas

#### Catálogo de Flota
- Grid de tarjetas con las unidades disponibles
- Filtros por:
  - **Tipo de vehículo** (Class A, B, C, Travel Trailer, etc.)
  - **Capacidad para dormir** (2, 4, 6, 8+)
  - **Largo** (en pies/metros)
  - **Rango de precio** (por noche, en CAD)
  - **Características** (pet friendly, slide-outs, generador, etc.)
  - **Ubicación de pickup** (Vancouver, Calgary, Toronto, Montreal, Halifax)
  - **Fecha de disponibilidad**
- Ordenamiento: Recomendado, Precio ↑↓, Tamaño ↑↓, Rating
- Vista: Grid / Lista / Comparar

#### Ficha de Unidad (Detail Page)
Ver sección [8. Ficha Técnica por Unidad](#8-ficha-técnica-por-unidad)

#### Calendario de Disponibilidad
Ver sección [7. Sistema de Disponibilidad y Calendario](#7-sistema-de-disponibilidad-y-calendario)

#### Sección "Cómo Funciona"
Proceso en 3 pasos (estándar de la industria):
1. **Elige tu RV** — Selecciona fechas y unidad
2. **Reserva y paga** — Depósito seguro, confirmación instantánea
3. **Recógela o te la llevamos** — Pickup en ubicación o delivery

#### Sección de Rutas y Destinos
- Rutas populares con mapas interactivos
- Distancias y tiempos estimados
- Campamentos recomendados por ruta
- Temporada ideal para cada ruta

#### Testimonios y Reseñas
- Calificaciones por unidad (1-5 estrellas)
- Reseñas verificadas de clientes
- Fotos de clientes en sus viajes
- Video testimonials

#### FAQ
- Preguntas frecuentes organizadas por categoría:
  - Reservas y pagos
  - Requisitos de licencia
  - Qué incluye la renta
  - Políticas de cancelación
  - Seguro y responsabilidad
  - Uso del generador y tanques
  - Mascotas
  - Delivery y pickup

#### Blog / Guías
- Guías de rutas
- Tips para primerizos
- Comparativas de modelos
- Temporadas y clima

#### Footer
- Información de contacto
- Ubicaciones de pickup
- Redes sociales
- Términos y condiciones
- Política de privacidad
- Idioma (EN/FR toggle)

---

### 6.2 Funcionalidades interactivas

#### Comparador de unidades
- Seleccionar hasta 3 unidades para comparar lado a lado
- Tabla comparativa con todas las especificaciones
- Diferencias resaltadas

#### Calculadora de costo
- Input: fechas, distancia estimada, extras deseados
- Output: desglose detallado:
  - Tarifa base × noches
  - Paquete de kilometraje
  - Seguro
  - Extras (linen kit, sillas, parrilla, etc.)
  - Impuestos (GST/HST según provincia)
  - **Total estimado**

#### Mapa interactivo de ubicaciones
- Marcadores de puntos de pickup
- Rutas populares trazadas
- Campamentos cercanos
- Servicios (gasolineras, dump stations)

#### Widget de reservación rápida
- Siempre visible (sticky) en la ficha de unidad
- Selector de fechas
- Cálculo de precio en vivo
- Botón de "Reservar Ahora"

---

## 7. Sistema de Disponibilidad y Calendario

### 7.1 Estados de una unidad

Cada unidad puede estar en uno de estos estados:

| Estado | Visual | Descripción |
|---|---|---|
| **Disponible** | 🟢 Verde | Libre para reservar en las fechas consultadas |
| **Ocupada** | 🔴 Rojo | Actualmente rentada. **Muestra fecha tentativa de disponibilidad** |
| **En mantenimiento** | 🟡 Amarillo | Fuera de servicio temporal (reparación, limpieza profunda) |
| **Reservada parcialmente** | 🟠 Naranja | Tiene algunas fechas bloqueadas pero hay gaps disponibles |
| **Próximamente** | 🔵 Azul | Unidad nueva ingresando a la flota, fecha de activación |

### 7.2 Calendario de disponibilidad

#### Vista principal
- **Calendario mensual** interactivo para cada unidad
- Días disponibles en verde, ocupados en rojo, mantenimiento en amarillo
- Hover sobre día ocupado muestra: "Ocupada hasta el [fecha]"
- Click en fecha disponible inicia el proceso de reserva

#### Información para unidades ocupadas
Cuando una unidad está ocupada, la ficha muestra:
```
┌─────────────────────────────────────────────┐
│  🔴 Estado: Ocupada actualmente             │
│                                             │
│  📅 Disponible a partir del: 15 de Agosto   │
│     (fecha tentativa, sujeta a cambio)      │
│                                             │
│  📧 ¿Quieres que te avisemos?              │
│     [Notificarme cuando esté disponible]   │
│                                             │
│  🔔 Recibir notificación por email/SMS      │
└─────────────────────────────────────────────┘
```

#### Funcionalidad de notificación de disponibilidad
- El usuario puede registrarse para recibir alerta cuando la unidad se desocupe
- Se captura email (y opcionalmente teléfono para SMS)
- Notificación automática al momento de liberarse
- Opción de pre-reserva con depósito

### 7.3 Vista de flota completa (calendario maestro)

Un calendario tipo Gantt que muestra TODAS las unidades en el eje Y y las fechas en el eje X:
- Línea horizontal coloreada por estado
- Permite ver de un vistazo la ocupación general de la flota
- Filtrable por tipo de unidad, ubicación
- Solo accesible para administradores (no público)

### 7.4 Lógica de reservas

```
Flujo de reserva:
1. Usuario selecciona fechas (check-in / check-out)
2. Sistema verifica disponibilidad en tiempo real
3. Si disponible → mostrar precio + extras → continuar a pago
4. Si ocupada → mostrar próxima fecha disponible + opción de notificación
5. Si parcialmente disponible → mostrar gaps + sugerir fechas alternativas
6. Confirmación de reserva → bloqueo de fechas en calendario
7. Email de confirmación con todos los detalles
```

---

## 8. Ficha Técnica por Unidad

### Layout de la página de detalle

```
┌──────────────────────────────────────────────────────────────┐
│  [Galería de fotos / Tour virtual 360°]                      │
│  ← Imagen 1 de 12 →                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  2024 Jayco Redhawk 26B                    Class C Motorhome │
│  ★★★★☆ (24 reseñas)                                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 🛏 6 Sleep  │  │ 📐 26'8"   │  │ 📍 Calgary  │          │
│  │             │  │  8.13 m     │  │             │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                              │
├────────────────────────┬─────────────────────────────────────┤
│                        │  📅 RESERVA                         │
│  ESPECIFICACIONES      │  ┌─────────────────────────┐       │
│                        │  │ Check-in:  [__________] │       │
│  Dimensiones           │  │ Check-out: [__________] │       │
│  • Largo: 8.13 m       │  └─────────────────────────┘       │
│  • Ancho: 2.57 m       │                                     │
│  • Altura: 3.66 m      │  💰 Desde $189 CAD/noche           │
│  • Interior: 2.03 m    │                                     │
│  • Slide-outs: 1       │  Desglose:                          │
│                        │  • 5 noches × $189 = $945          │
│  Capacidad             │  • Km package (800km): $300        │
│  • Duerme: 6           │  • Seguro (5 días): $100           │
│  • Cinturones: 6       │  • Extras: $75                     │
│  • Agua limpia: 288 L  │  • Subtotal: $1,420               │
│  • Aguas grises: 159 L │  • Tax (GST 5%): $71              │
│  • Aguas negras: 121 L │  ─────────────────────────         │
│                        │  TOTAL: $1,491 CAD                 │
│  Motor / Chasis        │                                     │
│  • Chasis: Ford E-450  │  [ RESERVAR AHORA ]                │
│  • Motor: 7.3L V8      │                                     │
│  • Transmisión: Auto   │  ¿Preguntas?                       │
│  • Combustible: Gas    │  📞 1-800-XXX-XXXX                 │
│  • Rendimiento: ~10 MPG│  💬 Chat en vivo                   │
│                        │                                     │
│  AMENIDADES            ├─────────────────────────────────────┤
│                        │                                     │
│  🍳 Cocina             │  📅 DISPONIBILIDAD                  │
│  ✓ Refrigerador 10ft³  │  [Calendario mensual interactivo]  │
│  ✓ Estufa 3 quemadores │                                     │
│  ✓ Microondas          │  🟢 Disponible  🔴 Ocupada         │
│  ✓ Doble lavadero      │  🟡 Mantenimiento                  │
│                        │                                     │
│  🚿 Baño               │  Unidad ocupada hasta:              │
│  ✓ Ducha completa      │  📅 15 de Agosto 2026              │
│  ✓ Inodoro porcelana   │  [Notificarme cuando esté libre]   │
│  ✓ Lavamanos           │                                     │
│                        │                                     │
│  🛏 Dormitorio          ├─────────────────────────────────────┤
│  ✓ Queen bed 60"×80"   │  RESEÑAS                            │
│  ✓ Cabover bunk        │  ★★★★★ "Increíble experiencia..."  │
│  ✓ Sofa cama           │  ★★★★☆ "Muy cómodo para familia"   │
│  ✓ Dinette convertible │  [Ver las 24 reseñas]              │
│                        │                                     │
│  ❄️ Clima              │                                     │
│  ✓ A/C 13,500 BTU      │                                     │
│  ✓ Calefacción propano │                                     │
│  ✓ Calentador agua     │                                     │
│                        │                                     │
│  ⚡ Sistemas            │                                     │
│  ✓ 30 amp              │                                     │
│  ✓ Generador 4000W     │                                     │
│  ✓ Baterías            │                                     │
│                        │                                     │
│  🎬 Entretenimiento    │                                     │
│  ✓ TV 40" LED          │                                     │
│  ✓ Bluetooth stereo    │                                     │
│  ✓ WiFi hotspot (opt.) │                                     │
│                        │                                     │
│  🔒 Seguridad          │                                     │
│  ✓ Detector de humo    │                                     │
│  ✓ Detector de CO      │                                     │
│  ✓ Extintor            │                                     │
│  ✓ Cámara de reversa   │                                     │
│                        │                                     │
│  🐾 Pet Friendly       │                                     │
│                        │                                     │
├────────────────────────┴─────────────────────────────────────┤
│                                                              │
│  PLANO DE PLANTA (Floor Plan)                                │
│  [Diagrama SVG interactivo de la distribución]               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GALERÍA DE FOTOS DEL INTERIOR                               │
│  [Cocina] [Baño] [Dormitorio] [Sala] [Exterior]             │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  RUTAS RECOMENDADAS PARA ESTA UNIDAD                         │
│  [Rocky Mountains] [Vancouver Island] [Quebec]               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  UNIDADES SIMILARES                                          │
│  [Tarjeta 1] [Tarjeta 2] [Tarjeta 3]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Arquitectura Técnica

### 9.1 Stack tecnológico recomendado

| Capa | Tecnología | Justificación |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router) | SSR/SSG para SEO, React ecosystem, internacionalización nativa |
| **UI Framework** | Tailwind CSS + shadcn/ui | Diseño consistente, responsive, accesible |
| **Estado** | Zustand / TanStack Query | Ligero, performante, cache de datos del servidor |
| **Backend/API** | Next.js API Routes + tRPC | Type-safe, integrado con el frontend |
| **Base de datos** | PostgreSQL + Prisma ORM | Relacional para datos estructurados de flota y reservas |
| **Auth** | NextAuth.js / Clerk | Autenticación flexible, soporte social login |
| **Imágenes** | Cloudinary / Next Image | Optimización automática, lazy loading, responsive |
| **Pagos** | Stripe | Estándar en Canadá, soporte CAD, múltiples métodos |
| **Email** | Resend / SendGrid | Transactional emails (confirmaciones, notificaciones) |
| **Calendar** | Custom + date-fns | Lógica de negocio específica para disponibilidad |
| **Hosting** | Vercel | Edge functions, CDN global, deploy automático |
| **Analytics** | Plausible / GA4 | Tracking de conversiones, comportamiento |
| **CMS** | Sanity / Payload CMS | Gestión de contenido, blog, rutas |

### 9.2 Modelo de datos (entidades principales)

```
┌─────────────────────┐       ┌─────────────────────┐
│       Vehicle        │       │    VehicleSpec       │
├─────────────────────┤       ├─────────────────────┤
│ id                   │       │ id                   │
│ name                 │       │ vehicleId            │
│ slug                 │       │ lengthM / lengthFt   │
│ type (enum)          │       │ widthM / widthFt     │
│ brand                │       │ heightM / heightFt   │
│ year                 │       │ interiorHeightM      │
│ class (A/B/C/...)    │       │ areaSqm / areaSqft   │
│ status               │       │ slideOuts            │
│ sleepCapacity        │       │ seatBelts            │
│ seatBelts            │       │ freshWaterGal        │
│ pricePerNightCAD     │       │ grayWaterGal         │
│ locationId           │       │ blackWaterGal        │
│ petFriendly          │       │ fuelCapacityGal      │
│ description          │       │ gvwrLbs              │
│ floorPlanSvg         │       │ engine               │
│ mainImage            │       │ chassis              │
│ availableFromDate    │       │ transmission         │
│ createdAt            │       │ mpg                  │
│ updatedAt            │       │ generatorWatts       │
└─────────┬───────────┘       │ awningLengthM        │
          │                    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          │    │   VehicleImage      │
          │    ├─────────────────────┤
          │    │ id                   │
          │    │ vehicleId            │
          │    │ url                  │
          │    │ alt                  │
          │    │ category (enum)      │
          │    │ sortOrder            │
          │    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          │    │   VehicleAmenity    │
          │    ├─────────────────────┤
          │    │ id                   │
          │    │ vehicleId            │
          │    │ amenityId            │
          │    │ detail               │
          │    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          ├────│     Reservation     │
          │    ├─────────────────────┤
          │    │ id                   │
          │    │ vehicleId            │
          │    │ userId               │
          │    │ startDate            │
          │    │ endDate              │
          │    │ status (enum)        │
          │    │ totalCAD             │
          │    │ depositCAD           │
          │    │ kmPackage            │
          │    │ extras (JSON)        │
          │    │ insuranceCAD         │
          │    │ stripePaymentId      │
          │    │ notes                │
          │    │ createdAt            │
          │    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          ├────│   AvailabilityBlock │
          │    ├─────────────────────┤
          │    │ id                   │
          │    │ vehicleId            │
          │    │ startDate            │
          │    │ endDate              │
          │    │ type (enum)          │
          │    │ reservationId        │
          │    │ reason               │
          │    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          ├────│      Location       │
          │    ├─────────────────────┤
          │    │ id                   │
          │    │ name                 │
          │    │ city                 │
          │    │ province             │
          │    │ country              │
          │    │ address              │
          │    │ lat / lng            │
          │    │ phone                │
          │    │ pickupHours          │
          │    └─────────────────────┘
          │
          │    ┌─────────────────────┐
          └────│       Review        │
               ├─────────────────────┤
               │ id                   │
               │ vehicleId            │
               │ userId               │
               │ rating (1-5)         │
               │ title                │
               │ body                 │
               │ photos               │
               │ verified             │
               │ createdAt            │
               └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│       Amenity        │       │     Notification     │
├─────────────────────┤       ├─────────────────────┤
│ id                   │       │ id                   │
│ name                 │       │ vehicleId            │
│ icon                 │       │ email                │
│ category             │       │ phone                │
│ description          │       │ type (availability)  │
└─────────────────────┘       │ triggered            │
                              │ createdAt            │
                              └─────────────────────┘

┌─────────────────────┐
│       User           │
├─────────────────────┤
│ id                   │
│ email                │
│ name                 │
│ phone                │
│ province             │
│ country              │
│ licenseType          │
│ preferredLang        │
│ createdAt            │
└─────────────────────┘
```

### 9.3 API endpoints principales

```
GET    /api/vehicles                    # Listar flota (con filtros)
GET    /api/vehicles/:slug              # Detalle de unidad
GET    /api/vehicles/:slug/availability # Disponibilidad por rango de fechas
POST   /api/reservations                # Crear reserva
GET    /api/reservations/:id            # Detalle de reserva
POST   /api/notifications/availability  # Suscribirse a notificación
GET    /api/reviews?vehicleId=X         # Reseñas por unidad
GET    /api/locations                   # Ubicaciones de pickup
GET    /api/routes                      # Rutas populares
POST   /api/checkout                    # Iniciar pago (Stripe)
GET    /api/calculate-price             # Calculadora de precio
```

### 9.4 Estrategia de imágenes

- **Mínimo 10 fotos por unidad**: exterior (4), cocina (2), baño (2), dormitorio (2)
- **Formato**: WebP con fallback JPEG
- **Tamaños**: 400px (thumbnail), 800px (card), 1200px (detail), 1920px (hero)
- **Lazy loading**: Todas excepto la primera imagen del hero
- **Tour virtual 360°**: Para unidades premium (futuro)
- **Video walkthrough**: Recomendado (aumenta conversión 34% según datos de la industria)

---

## 10. Internacionalización (i18n) y Escalabilidad

### 10.1 Estrategia de i18n

Canadá es un país bilingüe (inglés y francés), por lo que la internacionalización no es opcional sino obligatoria desde el día 1.

#### Implementación técnica
```
URLs:
  /en/vehicles/jayco-redhawk-26b    # English
  /fr/vehicules/jayco-redhawk-26b   # Français

Middleware de Next.js para detección de idioma:
  1. Cookie del usuario (preferencia guardada)
  2. Accept-Language header
  3. Subdirectorio en URL (/en/ o /fr/)
  4. Default: /en/
```

#### Archivos de traducción
```
/locales
  /en
    common.json        # Textos generales
    vehicles.json      # Tipos de RV, amenidades
    booking.json       # Flujo de reserva
    routes.json        # Rutas y destinos
    legal.json         # Términos, privacidad
  /fr
    common.json
    vehicles.json
    booking.json
    routes.json
    legal.json
```

### 10.2 Escalabilidad internacional (futuro)

La arquitectura debe prepararse para expandirse a otros mercados:

#### Países objetivo potenciales
| Mercado | Idioma(s) | Moneda | Prioridad |
|---|---|---|---|
| 🇨🇦 Canadá | EN, FR | CAD | **Fase 1 (actual)** |
| 🇺🇸 Estados Unidos | EN | USD | Fase 2 |
| 🇬🇧 Reino Unido | EN | GBP | Fase 3 |
| 🇦🇺 Australia | EN | AUD | Fase 3 |
| 🇩🇪 Alemania / Europa | DE, FR, ES | EUR | Fase 4 |

#### Decisiones de arquitectura para escalabilidad

**Moneda:**
- Almacenar precios en la moneda local del mercado
- Tabla de configuración por país: `{ country: "CA", currency: "CAD", taxLabel: "GST/HST" }`
- No usar una moneda base universal; cada mercado tiene su propia configuración

**Unidades de medida:**
- Canadá usa sistema dual (métrico + imperial)
- Mostrar siempre ambas: "8.13 m (26 ft 8 in)"
- Configuración por mercado para cuál es la principal

**Impuestos:**
- Canadá: GST (5%) + HST/PST según provincia
- USA: Sales tax por estado
- UK: VAT (20%)
- Configuración de impuestos por jurisdicción

**Regulaciones de licencia:**
- Tabla `LicenseRequirement` por país → provincia/estado
- Cada mercado define sus propias reglas

**Ubicaciones:**
- Tabla `Country` → `Region` (provincia/estado) → `Location`
- Permite agregar nuevos países sin cambiar código

**Contenido localizado:**
- Rutas y destinos por país
- Campamentos por región
- Temporadas invertidas (Australia: verano en diciembre)

```
Schema de multi-tenant por país:

┌─────────────────────┐
│       Country        │
├─────────────────────┤
│ id                   │
│ code (CA, US, UK)    │
│ name                 │
│ currency (CAD, USD)  │
│ unitSystem (metric)  │
│ taxLabel (GST/HST)   │
│ taxRate (0.05)       │
│ languages [en, fr]   │
│ defaultLang          │
│ phonePrefix (+1)     │
│ domain / subdomain   │
│ active               │
└─────────────────────┘
         │
         ├──── Region (provincias/estados)
         │     • code, name, taxRate, licenseRules
         │
         ├──── Location (puntos de pickup)
         │     • city, address, phone, hours
         │
         └──── Vehicle (flota de ese país)
               • price en moneda local
               • specs en unidades locales
```

---

## 11. Diseño UX/UI

### 11.1 Principios de diseño

1. **Claridad sobre estética**: La información técnica debe ser fácil de encontrar y entender
2. **Mobile-first**: 60%+ del tráfico será móvil
3. **Accesibilidad**: WCAG 2.1 AA mínimo
4. **Velocidad**: Las imágenes de RVs son pesadas; optimización agresiva
5. **Confianza**: Transparencia en precios, sin costos ocultos
6. **Bilingüismo visual**: Toggle de idioma siempre visible

### 11.2 Paleta de colores sugerida

| Elemento | Color | Uso |
|---|---|---|
| Primary | `#1E40AF` (azul profundo) | CTAs, headers, links |
| Secondary | `#059669` (verde bosque) | Disponibilidad, confirmaciones |
| Accent | `#D97706` (ámbar) | Destacados, ofertas, badges |
| Danger | `#DC2626` (rojo) | Ocupada, errores, urgencia |
| Warning | `#F59E0B` (amarillo) | Mantenimiento, advertencias |
| Neutral | `#1F2937` → `#F9FAFB` | Texto, fondos, bordes |

### 11.3 Tipografía

| Uso | Fuente | Tamaño |
|---|---|---|
| Headings | Inter / Plus Jakarta Sans | 24-48px |
| Body | Inter | 16px |
| Specs / datos | JetBrains Mono / tabular nums | 14px |
| Español/Français | Soporte completo para acentos y caracteres especiales | — |

### 11.4 Componentes clave

- **Tarjeta de vehículo**: Imagen, nombre, tipo, capacidad, precio, estado (badge), CTA
- **Badge de estado**: Pill coloreado (Disponible/Ocupada/Mantenimiento)
- **Calendario**: Heatmap de disponibilidad, click para seleccionar rango
- **Comparador**: Tabla sticky con scroll horizontal en mobile
- **Floor plan**: SVG interactivo con hotspots clickeables
- **Calculadora de precio**: Stepper de pasos, desglose en tiempo real
- **Mapa**: Mapbox GL JS con clusters para ubicaciones

### 11.5 Responsive breakpoints

| Breakpoint | Ancho | Layout |
|---|---|---|
| Mobile | < 640px | 1 columna, cards apiladas |
| Tablet | 640 - 1024px | 2 columnas |
| Desktop | 1024 - 1440px | 3 columnas, sidebar |
| Wide | > 1440px | 3 columnas, layout ampliado |

---

## 12. SEO y Rendimiento

### 12.1 Estrategia SEO

#### Páginas indexables
- `/` — Landing page principal
- `/vehicles` — Catálogo de flota
- `/vehicles/[slug]` — Ficha de cada unidad
- `/routes/[slug]` — Rutas populares
- `/blog/[slug]` — Artículos del blog
- `/faq` — Preguntas frecuentes

#### Metadata por página
```typescript
// Ejemplo para ficha de vehículo
{
  title: "2024 Jayco Redhawk 26B | RV Rental Calgary | DC Rentals",
  description: "Rent this 2024 Jayco Redhawk Class C Motorhome in Calgary. Sleeps 6, 26'8\", full kitchen & bathroom. From $189/night CAD. Check availability.",
  openGraph: {
    title: "2024 Jayco Redhawk 26B - Class C Motorhome",
    description: "Sleeps 6 · 26'8\" · Full Kitchen · $189/night CAD",
    images: ["/og/jayco-redhawk-26b.jpg"],
    type: "website"
  }
}
```

#### Schema.org markup
- `Product` para cada vehículo (con `offers`, `aggregateRating`)
- `LocalBusiness` para cada ubicación
- `FAQPage` para la sección de preguntas frecuentes
- `BreadcrumbList` para navegación
- `RentalCarReservation` (adaptado)

#### Contenido SEO
- Cada vehículo tiene su propia URL con contenido único
- Rutas y destinos generan contenido de valor (long-tail keywords)
- Blog con guías: "How to rent an RV in Canada", "Best RV routes in BC"
- Hreflang tags para EN/FR

### 12.2 Core Web Vitals

| Métrica | Objetivo | Estrategia |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | Imágenes optimizadas, SSR, preload hero |
| **FID** (First Input Delay) | < 100ms | Code splitting, lazy load de componentes |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Dimensiones explícitas en imágenes, fuentes preload |
| **INP** (Interaction to Next Paint) | < 200ms | Minimizar JS, usar Server Components |

#### Estrategias de rendimiento
- **Imágenes**: Next.js Image component con Cloudinary, srcset responsivo
- **Fuentes**: `font-display: swap`, preload de fuentes críticos
- **JavaScript**: Code splitting por ruta, dynamic imports para componentes pesados
- **CSS**: Tailwind purge para eliminar CSS no utilizado
- **Caching**: ISR (Incremental Static Regeneration) para fichas de vehículos
- **CDN**: Edge caching en Vercel para assets estáticos

---

## 13. Consideraciones Legales y Regulatorias (Canadá)

### 13.1 Requisitos para el arrendatario

| Requisito | Detalle |
|---|---|
| **Edad mínima** | 21 años (estándar industria Canadá) |
| **Licencia de conducir** | Válida para la clase de vehículo (varía por provincia) |
| **Licencia internacional** | Turistas internacionales necesitan IDP + licencia de origen |
| **Depósito de seguridad** | $500 - $2,000 CAD (varía por unidad) |
| **Seguro** | Obligatorio. Opciones: seguro propio del operador o seguro del rentatario |

### 13.2 Impuestos por provincia

| Provincia | Impuesto aplicable | Tasa total |
|---|---|---|
| Alberta | GST | 5% |
| British Columbia | GST + PST | 12% |
| Manitoba | GST + PST | 12% |
| New Brunswick | HST | 15% |
| Newfoundland | HST | 15% |
| Nova Scotia | HST | 15% |
| Ontario | HST | 13% |
| PEI | HST | 15% |
| Quebec | GST + QST | 14.975% |
| Saskatchewan | GST + PST | 11% |

### 13.3 Políticas de cancelación (estándar recomendado)

| Ventana de cancelación | Penalización |
|---|---|
| 30+ días antes | Reembolso completo menos depósito no reembolsable |
| 15-29 días | 50% del total |
| 7-14 días | 75% del total |
| < 7 días | Sin reembolso |
| No-show | Sin reembolso |

### 13.4 Documentación legal necesaria

- Términos y condiciones de servicio
- Política de privacidad (PIPEDA compliant en Canadá)
- Acuerdo de renta (rental agreement)
- Formulario de inspección de vehículo (check-in / check-out)
- Waiver de responsabilidad
- Política de combustible (lleno a lleno)
- Política de kilometraje
- Política de limpieza y daños

### 13.5 PIPEDA (Ley de protección de datos de Canadá)

- Consentimiento explícito para recolección de datos personales
- Derecho de acceso, corrección y eliminación de datos
- Notificación de breaches
- Almacenamiento de datos en servidores dentro de Canadá (idealmente)
- Política de cookies clara

---

## 14. Modelo de Negocio y Pricing

### 14.1 Estructura de precios

```
Precio total de una reserva:

┌─────────────────────────────────────────────────┐
│                                                 │
│  Tarifa base por noche          $XXX CAD × N    │
│  + Paquete de kilometraje       $XXX CAD        │
│  + Seguro diario                $XX CAD × N     │
│  + Extras (linen, grill, etc.)  $XXX CAD        │
│  + Delivery fee (si aplica)     $XX CAD/km      │
│  ─────────────────────────────────────────      │
│  Subtotal                       $X,XXX CAD      │
│  + Impuestos (GST/HST/PST)     $XXX CAD        │
│  ─────────────────────────────────────────      │
│  TOTAL                          $X,XXX CAD      │
│                                                 │
│  Depósito de seguridad          $1,000 CAD      │
│  (reembolsable al retorno)                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 14.2 Extras disponibles

| Extra | Precio estimado (CAD) |
|---|---|
| Linen kit (sábanas, toallas, almohadas) | $75 - $125 |
| Kit de conveniencia (sartenes, utensilios, platos) | $50 - $100 |
| Parrilla de gas portátil | $25 - $50 |
| Sillas de camping (set de 4) | $30 - $50 |
| Bicicletarack | $25 - $40 |
| WiFi hotspot (incluye 5GB) | $10/día |
| S'mores kit | $15 |
| Coolbox | $15 - $25 |
| Kit de entretenimiento exterior | $50 - $100 |
| Paquete premium outdoor (combinación) | $99 (3 días) / $149 (7 días) |
| Delivery + setup + pickup | $125 - $325 (según distancia) |
| Paquete Platinum (outdoor + delivery) | $225 (3 días) / $299 (7 días) |

### 14.3 Estacionalidad de precios

| Temporada | Meses | Multiplicador |
|---|---|---|
| Baja | Nov - Mar | 0.7x - 0.8x |
| Media | Abr, Oct | 0.9x - 1.0x |
| Alta | May - Sep | 1.0x - 1.3x |
| Pico | Jul - Ago | 1.2x - 1.5x |
| Eventos especiales | (ej. Stampede, festivales) | 1.5x - 2.0x |

---

## 15. Roadmap de Desarrollo

### Fase 1: MVP (Semanas 1-6)

**Objetivo**: Landing page funcional con catálogo y flujo de contacto básico

- [ ] Setup del proyecto (Next.js, Tailwind, DB)
- [ ] Modelo de datos de vehículos y especificaciones
- [ ] Página principal con hero y catálogo
- [ ] Ficha de vehículo con especificaciones completas
- [ ] Galería de imágenes
- [ ] Calendario de disponibilidad (visual)
- [ ] Formulario de contacto / solicitud de cotización
- [ ] Responsive design mobile-first
- [ ] SEO básico (meta tags, sitemap, robots.txt)
- [ ] Deploy en Vercel

### Fase 2: Reservas (Semanas 7-12)

**Objetivo**: Sistema de reservas funcional con pagos

- [ ] Integración de Stripe para pagos
- [ ] Flujo completo de reserva (selección → pago → confirmación)
- [ ] Sistema de autenticación de usuarios
- [ ] Calculadora de precio en tiempo real
- [ ] Email de confirmación de reserva
- [ ] Panel de administración básico (ver reservas)
- [ ] Bloqueo automático de fechas reservadas
- [ ] Políticas de cancelación implementadas

### Fase 3: Experiencia (Semanas 13-18)

**Objetivo**: Funcionalidades avanzadas de UX

- [ ] Comparador de unidades
- [ ] Sistema de reseñas y calificaciones
- [ ] Notificaciones de disponibilidad (email)
- [ ] Plano de planta interactivo (SVG)
- [ ] Mapa de ubicaciones (Mapbox)
- [ ] Blog / guías de rutas
- [ ] Tour virtual 360° (para unidades premium)
- [ ] Video walkthroughs

### Fase 4: Bilingüismo y optimización (Semanas 19-22)

**Objetivo**: Sitio completamente bilingüe y optimizado

- [ ] Traducción completa EN/FR
- [ ] Middleware de detección de idioma
- [ ] Hreflang tags
- [ ] Contenido localizado (rutas, campamentos por provincia)
- [ ] Optimización de Core Web Vitals
- [ ] Schema.org markup completo
- [ ] A/B testing de CTAs y layouts
- [ ] Analytics avanzado (funnel de conversión)

### Fase 5: Escalabilidad (Semanas 23+)

**Objetivo**: Preparar la plataforma para múltiples mercados

- [ ] Arquitectura multi-país (configuración por mercado)
- [ ] Multi-moneda
- [ ] Multi-unidades (métrico/imperial configurable)
- [ ] Configuración de impuestos por jurisdicción
- [ ] API pública para integraciones (partners, OTA)
- [ ] App móvil (React Native / PWA)
- [ ] Integración con plataformas de RV (RVshare, Outdoorsy)
- [ ] Sistema de fidelización / programa de referidos

---

## Apéndice A: Glosario de Términos RV

| Término | Definición |
|---|---|
| **RV** | Recreational Vehicle — vehículo recreativo |
| **Class A/B/C** | Clasificación de motorhomes por tamaño y chasis |
| **Slide-out** | Sección extensible que amplía el espacio interior cuando el RV está estacionado |
| **Cabover / Cabover bunk** | Cama sobre la cabina del conductor (típica en Class C) |
| **GVWR** | Gross Vehicle Weight Rating — peso máximo permitido |
| **GCWR** | Gross Combined Weight Rating — peso máximo combinado (vehículo + remolque) |
| **Awning** | Toldo retráctil lateral |
| **Dump station** | Estación para vaciar tanques de aguas negras/grises |
| **Hookups** | Conexiones de agua, electricidad y alcantarillado en campamentos |
| **Dry camping / Boondocking** | Acampar sin conexiones (agua, electricidad, drenaje) |
| **Full hookups** | Campamento con todas las conexiones (30/50 amp, agua, sewer) |
| **Pull-through** | Sitio de campamento donde se puede entrar y salir sin reversa |
| **Toad** | Vehículo que se remolca detrás de un motorhome ("towed vehicle") |
| **DPF** | Diesel Particulate Filter |
| **BTU** | British Thermal Unit — medida de capacidad de A/C y calefacción |
| **LP / Propane** | Gas licuado de petróleo, usado para estufa, calefacción, calentador de agua |
| **Gray water** | Agua usada de lavabo, ducha, cocina |
| **Black water** | Agua del inodoro |
| **Cassette toilet** | Inodoro con tanque removible pequeño |
| **Leveling jacks** | Gatos estabilizadores para nivelar el RV |
| **Inversor** | Convierte corriente DC (batería) a AC (110V) |
| **30 amp / 50 amp** | Capacidad eléctrica del RV (30 amp = unidades pequeñas; 50 amp = grandes) |

## Apéndice B: Benchmarks de la Industria (Canadá)

| Métrica | Valor | Fuente |
|---|---|---|
| Reservas de primerizos | 66% | Outdoorsy 2021 |
| Precio promedio trailer | $100-$150 CAD/noche | RVezy / CRVA |
| Precio promedio motorhome | $200-$300 CAD/noche | RVezy / CRVA |
| Precio grandes operadores | $100-$400 CAD/noche | CanaDream, Fraserway |
| Tamaño típico RV | 20-33 ft | Industria general |
| Factor de conversión video | +34% | Vintory / VRMA |
| Reducir links externos (5→1) | +29% conversión | Vintory / VRMA |
| Limpieza como factor #1 | 80% | Outdoorsy survey |
| Kitchen full como factor #2 | 57% | Outdoorsy survey |
| Intento de compra post-renta | 44% | Outdoorsy survey |
| Bookings verano → salto | 650% en Mayo | Outdoorsy Canada |
| Parques y campings en Canadá | 2,920 | Statistics Canada 2023 |
| Negocios de renta RV | 1,753 | Statistics Canada 2023 |
| Dealers de RV | 1,128 | Statistics Canada 2023 |

## Apéndice C: Consideraciones de Accesibilidad (WCAG 2.1 AA)

- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande
- Navegación completa por teclado
- ARIA labels en todos los componentes interactivos
- Alt text descriptivo en todas las imágenes de vehículos
- Formularios con labels asociados y mensajes de error claros
- Skip links para navegación
- Soporte para lectores de pantalla (VoiceOver, NVDA)
- Animaciones con `prefers-reduced-motion`
- Zoom hasta 200% sin pérdida de funcionalidad

---

> **Última actualización**: Octubre 2026
> **Autor**: DC Rentals — Documento de construcción de Landing Page
> **Estado**: Borrador inicial — Pendiente de revisión y aprobación