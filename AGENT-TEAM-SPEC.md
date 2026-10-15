# DC Rentals — Especificación del Equipo de Agentes

> **Propósito**: Define el equipo de agentes de desarrollo (OpenCode), las funciones de cada agente, cuándo actúa, el flujo de comunicación entre ellos y los procesos de garantía de calidad (**SDD** y **TDD con loop AC/DC**).
>
> **Documentos de entrada**: `TECHNICAL-SPEC.md` (v2 — Astro/Supabase) y `LANDING-PAGE.md`.
> **Última actualización**: Octubre 2026

---

## Índice

1. [Glosario y definiciones clave](#1-glosario-y-definiciones-clave)
2. [Organigrama y principios](#2-organigrama-y-principios)
3. [Ficha de agentes](#3-ficha-de-agentes)
4. [Flujo de comunicación](#4-flujo-de-comunicación)
5. [Proceso de calidad: SDD](#5-proceso-de-calidad-sdd)
6. [Proceso de calidad: TDD + loop AC/DC](#6-proceso-de-calidad-tdd--loop-acdc)
7. [Fases de ejecución y matriz RACI](#7-fases-de-ejecución-y-matriz-raci)
8. [Manejo de fallos y escalación](#8-manejo-de-fallos-y-escalación)
9. [Mantenimiento post-launch](#9-mantenimiento-post-launch)
10. [Artefactos canónicos y registro de decisiones](#10-artefactos-canónicos-y-registro-de-decisiones)

---

## 1. Glosario y definiciones clave

| Término | Definición operativa |
|---|---|
| **SDD** (Software Design Document) | El `TECHNICAL-SPEC.md` en su versión v2. Es la fuente única de verdad de arquitectura, schemas, contratos de API, tokens de diseño, presupuesto de performance y ADRs. Ningún agente puede desviarse de él sin una decisión registrada en la sección 20 (ADRs). |
| **TDD** (Test-Driven Development) | Ciclo obligatorio para toda lógica de negocio: escribir primero el test que falla (red), desarrollar el mínimo para que pase (green), refactorizar, repetir. Aplica a: motor de precios, lógica de disponibilidad, schemas Zod, contratos de endpoints, y la lógica de los islands React (con Testing Library). |
| **AC/DC** (Agent Centric Development Cycle) | Ciclo de desarrollo centrado en el agente: cada agente especialista es dueño de una tarea de extremo a extremo dentro de su dominio. El ciclo interno de cada tarea es: **definir AC (criterios de aceptación, aprobados por Tech Lead) → TDD (red → green → refactor) → Check (verificación contra AC + SDD) → cerrar o repetir**. El agente no entrega nada sin haber pasado el Check. "Centric" significa que el conocimiento de la tarea permanece en un solo agente (sin ping-pong de contexto entre agentes para una misma tarea). |
| **AC** (Acceptance Criteria) | Criterios verificables de una tarea, escritos por el agente responsable antes de codificar, aprobados por el Tech Lead. Formato Gherkan-lite: `Dado / Cuando / Entonces` o checklist objetiva. Cada AC debe ser automatizable o verificable manualmente de forma explícita. |
| **DoD** (Definition of Done) | Puerta de cierre de tarea: todos los AC en verde + tests pasando + SDD compliance confirmado + lint/type-check limpios + reporte emitido al Tech Lead. |
| **Orquestador (humano)** | El usuario del proyecto. Aprueba hitos de fase, toma decisiones de alcance y resuelve escalaciones del Tech Lead. |

---

## 2. Organigrama y principios

```
                         ┌──────────────────────┐
                         │   ORQUESTADOR (humano)│  Aprueba fases, alcance,
                         └──────────▲───────────┘  resuelve escalaciones
                                    │ (solo decisiones de negocio/alcance)
                         ┌──────────┴───────────┐
                         │   @tech-lead (agente) │  Coordina, revisa, arbitra,
                         │   Orquestador IA      │  guarda el SDD, aprueba AC
                         └──────────┬───────────┘
            ┌───────────┬───────────┼───────────┬───────────┬────────────┐
            ▼           ▼           ▼           ▼           ▼            ▼
     ┌────────────┐┌─────────┐┌──────────┐┌──────────┐┌─────────┐┌──────────┐
     │@foundation ││@ui-     ││@catalog  ││@interac- ││@api-data││@qa-seo   │
     │ Infra/base ││design   ││Contenido ││tivity    ││API/datos││QA/SEO/Perf│
     └────────────┘└─────────┘└──────────┘└──────────┘└─────────┘└──────────┘
                                                              (Fase 5: + @ops)
```

**Principios de operación**:

1. **Hub-and-spoke con el Tech Lead**: toda comunicación formal (asignaciones, reportes, handoffs, escalaciones) pasa por el Tech Lead. Los agentes NO se asignan trabajo entre sí directamente.
2. **Colaboración lateral permitida, decisión no**: dos agentes pueden intercambiar artefactos (p. ej. @catalog entrega los tipos que consume @interactivity), pero ningún agente le impone cambios a otro; las disputas las resuelve @tech-lead.
3. **Tech Lead consulta al humano**: @tech-lead decide lo técnico dentro del SDD, pero **escala al Orquestador (humano)** antes de: cambiar alcance, aprobar desviaciones del SDD (nuevos ADRs), aprobar cada transición de fase, y autorizar trabajo fuera del plan.
4. **Un dueño por artefacto**: cada archivo/módulo tiene un único agente responsable de editarlo (ver tabla de propiedad en §3). Evita conflictos y merge hell.
5. **Sesiones efímeras, contexto en artefactos**: el conocimiento vive en archivos (`reports/`, ADRs, ACs), no en la memoria de las sesiones. Un agente que retoma una tarea lee sus artefactos, no su historial.

---

## 3. Ficha de agentes

Cada ficha define: **funciones**, **cuándo actúa** (triggers), **entradas/salidas**, **comunicación** y **dominio de propiedad** (archivos que edita).

---

### 3.1 @tech-lead — Orquestador / Tech Lead

> **Misión**: Garante único del SDD y del proceso AC/DC. Traduce la dirección del humano en tareas asignables y asegura que el equipo entregue conforme al `TECHNICAL-SPEC.md`.

**Funciones**:

- Descomponer el alcance de cada fase en tareas con AC preliminares (usar `task-decomposer`).
- Definir y resolver dependencias entre tareas antes de asignarlas (usar `dependency-resolver`).
- Asignar tareas al agente dueño del dominio y aprobar/rechazar los AC que cada agente propone.
- **Guardián del SDD**: toda entrega pasa por su revisión de conformidad con el `TECHNICAL-SPEC.md` (checklist §5).
- Arbitrar conflictos entre agentes y disputas técnicas.
- Consolidar los outputs de los agentes en una respuesta cohesiva (usar `output-synthesizer`).
- Gestionar el presupuesto de contexto en sesiones largas (usar `context-compression`, `token-budget-tracker`).
- Reportar al Orquestador (humano): resumen de estado, riesgos, y **consulta explícita** antes de cada transición de fase y de toda desviación del SDD.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Inicio de proyecto / de fase | Planifica tareas, define dependencias, asigna primeras tareas |
| Un agente reporta tarea lista | Ejecuta la revisión SDD + AC y aprueba o rechaza con feedback accionable |
| Un agente se bloquea > 2 intentos | Toma decisión de diseño o escala al humano |
| Conflicto entre agentes | Arbitra y dicta la resolución |
| Fin de fase | Consolidación, reporte al humano, solicitud de aprobación para siguiente fase |
| Solicitud de cambio del humano | Reformula el alcance en tareas AC/DC y reasigna |

**Entradas**: reportes de todos los agentes, `TECHNICAL-SPEC.md`, feedback del humano.
**Salidas**: tareas con AC aprobados, resoluciones ADR, reportes de estado al humano, aprobaciones de fase.

**Comunicación**: recibe reportes de los 6 agentes; entrega asignaciones y aprobaciones. **Único agente que habla con el Orquestador humano.**

**Propiedad**: `reports/decisions.md` (registro de decisiones), definición de tareas, ADRs propuestos. No edita código de producción.

---

### 3.2 @foundation — Infraestructura y Base

> **Misión**: Levantar el esqueleto del proyecto: Astro, Tailwind, i18n, Supabase, CI/CD y deploy. Desbloquea todo lo demás.

**Funciones**:

- Inicializar proyecto Astro (§1.1 del spec), `astro.config.mjs`, `tsconfig.json`, Tailwind con tokens, ESLint + Prettier.
- Configurar i18n nativo de Astro (§7), estructura `public/locales/`, helper `t()`.
- Crear proyecto Supabase, ejecutar `supabase/schema.sql` (§4.2), RLS, seed; clientes `supabase.ts` y `supabase-browser.ts`.
- `.env.example` completo (§3) y env vars en Vercel (tras aprobación del humano).
- `vercel.json` (§17), proyecto en Vercel Hobby, GitHub Actions CI (§17.4).
- Configurar Vitest (§15.1) y Playwright con smoke test mínimo.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fase 1 aprobada por el humano | Ejecuta el setup completo (secuencia AC/DC por tarea asignada) |
| @tech-lead le asigna infraestructura derivada (p. ej. nuevo endpoint necesita config) | Ajustes puntuales |
| Dependencias rotas / CI roto (reportado por @qa-seo) | Reparación prioritaria |

**Entradas**: §1, §3, §4.2, §7, §17 del spec; tareas del @tech-lead.
**Salidas**: repo compilando, `astro dev` y `astro build` verdes, proyecto Supabase con schema aplicado, deploy preview en Vercel, CI passing.

**Comunicación**: reporta hitos de setup a @tech-lead; bloqueos técnicos (p. ej. límites de Vercel) → @tech-lead → humano.

**Propiedad**: `astro.config.mjs`, `tailwind.config.*`, `tsconfig.json`, `.env.example`, `.github/workflows/`, `supabase/schema.sql`, `vitest.config.ts`, `src/lib/supabase*.ts`.

---

### 3.3 @ui-design — Design System y UI

> **Misión**: Definir y construir el sistema visual "moderno y fluido": tokens, componentes base Astro, layout, y la calidad de interacción visual (transiciones, responsive, a11y de presentación).

**Funciones**:

- Implementar tokens CSS y Tailwind (§6): paleta, tipografía (Inter / Plus Jakarta Sans), spacing, radios, sombras, transiciones.
- Componentes base `.astro`: `button`, `badge`, `card`, `input`, `select`, `container`, `header`, `footer`, `mobile-nav`, `language-switcher`.
- Definir el lenguaje de animación: curvas de transición, duraciones, patrones de hover/focus, uso de `motion-safe`/`motion-reduce` (base de la "fluidez").
- Guía de estilos responsive (breakpoints `tablet/desktop/wide`, mobile-first).
- Bloques de landing estáticos: `hero-section`, `how-it-works`, `cta-section`, `testimonials`, `popular-routes` (presentación; los datos vienen de @catalog).
- Auditoría visual de accesibilidad: contraste 4.5:1, focus-visible, skip links (§18).

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fase 1 completada (@foundation) y @tech-lead asigna Fase 2 | Construye design system + layouts + bloques estáticos de landing |
| @catalog entrega componente de contenido que necesita estilo | Le provee componentes/variantes requeridos |
| @interactivity necesita patrón visual para isla (p. ej. skeleton, overlay del lightbox) | Provee el componente base; @interactivity lo integra |
| Cambio visual solicitado por el humano vía @tech-lead | Itera sobre tokens/componentes |

**Entradas**: §6 y §18 del spec; definiciones de página de @tech-lead.
**Salidas**: design tokens, set de componentes `.astro`, landing con secciones visuales completas, guía breve de uso de componentes (`reports/design-guide.md`).

**Comunicación**: entrega guía y componentes a @catalog y @interactivity (vía reporte a @tech-lead que distribuye); dudas de alcance → @tech-lead.

**Propiedad**: `src/styles/`, `tailwind.config.*` (co-propiedad con @foundation; @ui-design es dueño de los tokens, @foundation del archivo de setup), `src/components/ui/`, `src/components/layout/`, `src/components/landing/` (parte visual).

---

### 3.4 @catalog — Contenido y Catálogo

> **Misión**: Modelar el contenido del proyecto: Content Collections con Zod, datos de vehículos reales de ejemplo, páginas SMD del sitio (landing de contenido, catálogo, fichas, rutas, blog, FAQ) e i18n de contenido.

**Funciones**:

- Definir `src/content.config.ts` con todos los schemas Zod (§4.1): vehicles, routes, blog, faq.
- Crear las entradas de ejemplo del catálogo (vehículos JSON con specs completas, rutas MDX bilingües, FAQ).
- `src/lib/content.ts`: helpers tipados (`getVehiclesForApi`, `getVehicleBySlug`, `getVehicleByCode`, `getSimilarVehicles`, rutas/blog por locale).
- Páginas SSG: `[locale]/index.astro` (landing con datos), `vehicles/index.astro`, `vehicles/[slug].astro`, `routes/[slug].astro`, `blog/[slug].astro`, `faq.astro`.
- Componentes de presentación de contenido: `vehicle-card.astro`, `vehicle-grid.astro`, `vehicle-specs.astro`, `vehicle-amenities.astro`, `review-card.astro`, `faq-section`.
- Validación de contenido en build (el schema Zod falla el build si hay datos inválidos) + test de unicidad de slugs/códigos.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fase 2 en paralelo a @foundation/@ui-design (tras aprobación del humano) | Modela colecciones, carga catálogo de ejemplo, construye páginas SSG |
| @tech-lead aprueba una nueva ficha de vehículo o ruta | Añade entradas a `src/content/` |
| @api-data necesita la forma de un vehículo para un endpoint | Le provee los tipos derivados del schema Zod |
| Cambio de contenido post-launch (vía @tech-lead o directo con checklist) | Edita JSON/MDX → push → rebuild automático |

**Entradas**: §4.1, §2.1 del spec; datos reales que pueda proveer el humano; componentes base de @ui-design.
**Salidas**: colecciones definidas y pobladas, helpers tipados, todas las páginas SSG renderizando con datos reales.

**Comunicación**: entrega de tipos/helpers a @api-data e @interactivity (por indicación de @tech-lead); dudas de estilo → @ui-design vía @tech-lead.

**Propiedad**: `src/content.config.ts`, `src/content/**`, `src/lib/content.ts`, `src/pages/[locale]/**` (páginas), `src/components/vehicle/*.astro` (presentación), `src/components/shared/review-card.astro`.

---

### 3.5 @interactivity — Islas React e Interacción

> **Misión**: Toda la interactividad de la app: **galería de imágenes (prioridad #1)**, calendario de disponibilidad, filtros del catálogo, widget de solicitud de reserva, stores y hooks.

**Funciones**:

- **ImageGallery** (requisito destacado del humano — criterios de aceptación en `reports/gallery-acceptance-criteria.md`, aprobados por @tech-lead):
  1. Grid + lightbox fullscreen con transición crossfade/scale (~200 ms, respetando `prefers-reduced-motion`)
  2. Navegación: ←/→ teclado, `Esc` cerrar, swipe táctil, botones prev/next
  3. Rail de miniaturas sincronizado + indicador "3 / 11"
  4. Preload de imágenes adyacentes (nav instantánea, sin flash negro)
  5. Filtros por categoría (`Exterior / Cocina / Baño / Dormitorio / Living / Plano`) usando el campo `category` del schema
  6. Zoom para detalle (doble click / pinch)
  7. `floorplan.svg` como slide ampliable del mismo gallery
  8. Performance: lazy del lightbox, srcset, sin penalizar LCP
  9. A11y: `role="dialog"`, focus trap, focus devuelto al cerrar, `aria-label` por imagen
  - Base sugerida: Embla Carousel o PhotoSwipe customizado (no gestos táctiles desde cero).
- Calendario de disponibilidad (island): fetch `/api/availability`, navegación de meses, selección de rango, leyenda de estados (§10).
- Filtros y orden del catálogo (island): fetch `/api/vehicles.json`, estado en `filter-store`.
- BookingWidget (island): formulario de solicitud, `PriceBreakdown` en vivo con `calculatePrice` (misma función pura que el server), `booking-store` con persist.
- Hooks: `use-availability`, `use-price-calculator`, `use-unit-preference`.
- Tests de los islands (Testing Library) dentro del ciclo AC/DC.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fase 3 (tras @ui-design y @catalog listos para sus dominios, y @api-data con contratos estables) | Construye islas siguiendo AC aprobados, TDD donde aplique |
| @tech-lead aprueba AC de la galería | **Prioridad máxima**: ImageGallery completo con los 9 criterios |
| @api-data publica un endpoint | Integra el fetch correspondiente (sin inventar contratos) |
| Bug visual/funcional reportado en preview por el humano | Reparación vía ciclo AC/DC (nuevo AC de bugfix) |

**Entradas**: §5, §9, §10, §12.1 del spec; componentes visuales de @ui-design; contratos de API de @api-data; helpers de @catalog.
**Salidas**: islas funcionando en preview, tests verdes, reporte de cierre con evidencia de AC/DC.

**Comunicación**: contratos con @api-data y @catalog coordinados por @tech-lead; estilos reutilizados de @ui-design; bugs de infra → @foundation vía @tech-lead.

**Propiedad**: `src/components/calendar/**`, `src/components/booking/**`, `src/components/vehicle/*.tsx`, `src/components/map/**`, `src/stores/**`, `src/hooks/**`.

---

### 3.6 @api-data — API y Datos

> **Misión**: Los 4 server endpoints, los clientes Supabase de server, el motor de precios y la lógica de disponibilidad. Es dueño del contrato entre front y datos.

**Funciones**:

- Server endpoints (§8): `GET /api/vehicles.json`, `GET /api/availability`, `GET /api/availability-check`, `POST /api/reservations` — todos con `prerender = false`, validación Zod y códigos de error definidos.
- `src/lib/validation.ts`: schemas Zod compartidos entre endpoints e islands.
- `src/lib/pricing.ts` (funciones puras, §11) y `src/lib/availability.ts` (§10.1) — **con tests unitarios escritos antes que la implementación (TDD)**.
- Flujo de reserva sin pagos (§12.1): verificar disponibilidad, congelar `price_snapshot`, insertar `PENDING`.
- `src/lib/email.ts`: acuse y notificación con Resend (degradar gracefully si no hay API key).
- Confirmación manual futura: mantener documentado el SQL de upgrade a confirmación vía endpoint (§4.2).
- Tests de contrato de cada endpoint.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fase 2 en paralelo (tras @foundation con Supabase listo) | Implementa pricing/disponibilidad (TDD) y endpoints |
| @tech-lead aprueba un cambio de contrato solicitado por @interactivity | Actualiza endpoint + schema Zod + documenta en reporte |
| Datos inconsistentes en Supabase (reportado por @qa-seo) | Reparación y ajuste de RLS/queries |

**Entradas**: §8, §10, §11, §12.1, §4.2 del spec; tipos de @catalog.
**Salidas**: endpoints respondiendo en preview, pruebas de contrato verdes, `pricing.ts`/`availability.ts` con cobertura alta y tests TDD evidenciados.

**Comunicación**: contratos firmados vía @tech-lead antes de que @interactivity los consuma; dudas de datos del catálogo → @catalog.

**Propiedad**: `src/pages/api/**`, `src/lib/pricing.ts`, `src/lib/availability.ts`, `src/lib/validation.ts`, `src/lib/email.ts`, `supabase/seed.sql`.

---

### 3.7 @qa-seo — QA, SEO y Performance

> **Misión**: Verificador externo independiente. No construye features; verifica, mide y audita. Ejecuta los "Check" finales de cada fase y es el **verificador del SDD** junto al @tech-lead.

**Funciones**:

- Mantener la suite E2E Playwright: `reservation-request.spec.ts`, `vehicle-detail.spec.ts`, navegación i18n, smoke test de landing.
- Ejecutar y mantener los tests unitarios de regresión (los de pricing/disponibilidad son de @api-data en TDD; @qa-seo asegura que se ejecuten en CI y no se rompan).
- Auditoría SDD por fase (checklist en §5): contratos, rutas, nombres, estructura de archivos vs spec.
- SEO: metadata, hreflang, canonical, JSON-LD Product, sitemap, robots (§14) — verificar con Rich Results Test y auditoría manual.
- Performance: Lighthouse en landing y ficha de vehículo, verificar presupuesto (§19: <60 KB JS inicial, LCP <2s), web vitals en preview.
- Accesibilidad: axe DevTools + tab testing + screen reader básico (§18).
- Reporte de bugs priorizados (P1/P2/P3) a @tech-lead.

**Cuándo actúa**:

| Trigger | Acción |
|---|---|
| Fin de cada fase (o entrega de milestone por un agente) | Ejecuta la auditoría completa de fase → reporte a @tech-lead |
| Deploy a preview en Vercel | Suite E2E + Lighthouse automatizado |
| Cada merge a `main` | CI completo (lint, type-check, unit, E2E smoke, build) |
| Sospecha de regresión (cualquier agente puede reportar) | Prueba focalizada |

**Entradas**: spec completo, previews de Vercel, reportes de entrega de cada agente.
**Salidas**: `reports/qa/phase-N-report.md` con hallazgos priorizados y veredicto (`APROBADO` / `CON HALLAZGOS P1` / `RECHAZADO`).

**Comunicación**: reporta exclusivamente a @tech-lead (quién distribuye los bugs al agente dueño). Puede **bloquear** transiciones de fase con veredicto `RECHAZADO` (motivado).

**Propiedad**: `tests/e2e/**`, `tests/setup.ts`, `reports/qa/**`. No edita código de producción — solo reporta.

---

### 3.8 @ops — Operaciones (solo Fase 5, post-launch)

> **Misión**: Mantenimiento continuo tras el launch. Puede ser un agente en modo rotación ocasional (no permanente).

**Funciones**:

- Dependencias: `npm audit`, bumps de patch/minor, actualizar Astro y adaptadores ante majors (evaluar con @tech-lead).
- Monitoreo: web vitals reales (Plausible), límites de Vercel Hobby y Supabase Free, alertas de build fallido.
- Backup: export semanal de `availability_blocks` y `reservation_requests` (SQL dump a repo privado o storage).
- Contenido: aplicar altas/bajas de vehículos siguiendo el checklist de @catalog (edición JSON/MDX + verificación de schema).
- Cierre de reservas: revisar `PENDING` antiguas con el humano, ejecutar confirmaciones/cancelaciones manuales (§4.2).
- Post-mortems menores: registrar incidentes en `reports/decisions.md`.

**Cuándo actúa**: semanalmente o por alerta; cambios mayores escalan al humano vía @tech-lead.

**Propiedad**: `reports/ops/**`, dependencias (`package.json` vía PR revisado por @tech-lead).

---

## 4. Flujo de comunicación

### 4.1 Topología

```
Orquestador (humano)
        ▲
        │ decisiones de alcance, aprobación de fases, desviaciones SDD
        │
   @tech-lead ◀────────────────────────────────────────────┐
        ▲                                                  │
        │ ① asignación + AC aprobados                      │ ④ reporte de
        │                                                  │    cierre (AC/DC
        │ ② reporte "tarea lista" + evidencia              │    evidencia)
        │    (AC cumplidos, tests, SDD mapping)            │
        │                                                  │
   @qa-seo ──── ③ auditoría de fase ───────────────────────┘
        │
        │ hallazgos P1..P3 (solo reporta, no asigna)
        ▼
   agente dueño del bug (designado por @tech-lead)
```

### 4.2 Canales y formatos

| Canal | Formato | Contenido mínimo |
|---|---|---|
| **Asignación** (@tech-lead → agente) | Prompt de tarea | Objetivo, AC preliminares, secciones SDD aplicables, artefactos de entrada, DoD |
| **Reporte de cierre** (agente → @tech-lead) | `reports/<agente>/task-<id>.md` | Resumen, AC y estado de cada uno, tests ejecutados, mapping SDD (secciones), archivos tocados, deudas/riesgos |
| **Auditoría de fase** (@qa-seo → @tech-lead) | `reports/qa/phase-<n>.md` | Veredicto, hallazgos P1-P3 con evidencia (screenshots, logs, números de Lighthouse) |
| **Escalación** (cualquiera → @tech-lead → humano) | En sesión o `reports/escalations.md` | Problema, intentos fallidos, opciones con pros/contras, recomendación |
| **Estado para el humano** (@tech-lead → humano) | Resumen de sesión | % avance por fase, riesgos, decisión requerida (con recomendación) |

### 4.3 Reglas de comunicación

1. **Ningún agente ejecuta trabajo fuera de su ficha sin asignación de @tech-lead.** Si detecta una mejora fuera de su dominio, la reporta (no la implementa).
2. **Contratos se firman antes de codificar**: cuando @interactivity necesita un endpoint o tipo, @tech-lead media la definición del contrato; @api-data lo implementa y @interactivity consume, sin renegotiar por su cuenta.
3. **Handoffs son simétricos y verificables**: entregar = reporte con evidencia; recibir = checklist de recepción en la siguiente tarea.
4. **Respuesta a P1**: @tech-lead asigna el fix en la misma sesión; el dueño reporta en ≤1 ciclo AC/DC.
5. **Bloqueo de fase**: solo @qa-seo (con veredicto motivado) o el humano pueden detener una transición de fase.

---

## 5. Proceso de calidad: SDD

### 5.1 ¿Quién cumple el SDD?

**Doble responsabilidad con roles separados** (separación entre quien ejecuta y quien verifica):

| Rol | Agente | Responsabilidad |
|---|---|---|
| **Dueño del SDD** | @tech-lead | Aprueba cada tarea contra el spec, rechaza desviaciones, registra excepciones como ADRs (§20 del spec), consulta al humano antes de toda desviación |
| **Verificador del SDD** | @qa-seo | Auditoría independiente por fase con checklist (§5.2); puede bloquear la fase |
| **Responsables de cumplimiento** | Todos los agentes de construcción | Cada reporte de cierre debe incluir el mapping "qué sección del spec implementa cada entregable" |

### 5.2 Checklist de conformidad SDD (ejecutado por @qa-seo por fase)

- [ ] Estructura de archivos conforme a §2 (ubicación de cada tipo de archivo)
- [ ] Contratos de API idénticos a §8 (rutas, métodos, schemas, códigos de error)
- [ ] Schema de Content Collections conforme a §4.1 (campos, tipos, defaults)
- [ ] Schema SQL de Supabase conforme a §4.2 (tablas, enums, RLS, índices)
- [ ] Tokens de diseño y clases base conforme a §6
- [ ] Rutas i18n `/en` + `/fr` y prefijos localizados (§7)
- [ ] Motor de precios idéntico a §11 (tolerancia ±0.01 en redondeos)
- [ ] Flujo de reserva sin pagos conforme a §12.1 (status PENDING, price_snapshot, sin rastro de Stripe)
- [ ] Feature flag `PUBLIC_ENABLE_PAYMENTS=false` presente; cero dependencias Stripe (§12.2)
- [ ] Variables de entorno alineadas a §3 (convención `PUBLIC_`)
- [ ] Presupuesto de performance §19 y checklist a11y §18
- [ ] Deploy en Vercel Hobby sin funciones prohibidas (sin crons, §17.1)

### 5.3 Excepciones al SDD

Si un agente identifica algo del spec que no es viable (p. ej. cambio en Astro, límite de Vercel):

1. Detiene el trabajo en ese punto de la tarea.
2. Escala a @tech-lead con opciones.
3. @tech-lead decide si es viable dentro del spec o escala al humano.
4. Toda excepción aprobada se registra como **ADR** en §20 del `TECHNICAL-SPEC.md` (el SDD se modifica explícitamente; nunca implícitamente en código).

---

## 6. Proceso de calidad: TDD + loop AC/DC

### 6.1 ¿Quién ejecuta el TDD con loop AC/DC?

- **Ejecuta el loop**: cada agente de construcción **dentro de sus propias tareas** — @catalog, @api-data, @interactivity (y @foundation para lógica no trivial como helpers de i18n o mapeo de env vars). Es "Agent Centric": el agente dueño lleva la tarea de extremo a extremo sin transferir contexto.
- **Define los AC**: el agente propone, **@tech-lead aprueba** antes de escribir código.
- **Verifica el loop**: @qa-seo confirma en la auditoría de fase que los tests existen, cubren los AC y corren en CI. @tech-lead verifica el mapping AC → evidencia en cada reporte de cierre.
- **Infraestructura de pruebas**: la provee @foundation (Vitest/Playwright) y la mantiene @qa-seo.

### 6.2 El loop AC/DC paso a paso (dentro de cada tarea)

```
┌────────────────────────────────────────────────────────────┐
│  ① PLAN     Agente define AC concretes de la tarea          │
│             (Dado/Cuando/Entonces)                          │
│                     │                                       │
│                     ▼                                       │
│  ② APPROVE  @tech-lead aprueba los AC (o devuelve)          │
│                     │                                       │
│                     ▼                                       │
│  ③ RED      Escribe el test que FALJA según el AC           │
│             (naming: describe/it describe el comportamiento) │
│                     │                                       │
│                     ▼                                       │
│  ④ GREEN    Implementa lo mínimo para que pase              │
│                     │                                       │
│                     ▼                                       │
│  ⑤ REFACTOR Mejora diseño/código sin romper tests          │
│                     │                                       │
│                     ▼                                       │
│  ⑥ CHECK    Verifica TODOS los AC + suite completa +        │
│             lint + type-check + mapping SDD                 │
│              ├─ ¿todo verde? → ⑦ CLOSE (reporte a @tech-lead)│
│              └─ ¿fallo?     → vuelve a ③ (nuevo ciclo)      │
└────────────────────────────────────────────────────────────┘
```

### 6.3 Qué requiere TDD obligatorio (por agente)

| Agente | TDD obligatorio para | Tipo de test |
|---|---|---|
| @api-data | `pricing.ts`, `availability.ts`, schemas Zod, contratos de endpoint | Unitario (Vitest) + contrato |
| @interactivity | Lógica de rangos del calendario, cálculo del PriceBreakdown del island, stores | Unitario + Testing Library |
| @catalog | Validación de colecciones, helpers de contenido | Unitario |
| @foundation | Helpers de i18n (`t()`, `localizedPath`) | Unitario |
| @ui-design | No aplica TDD de lógica; sí checklist visual + a11y por componente | Checklist verificable |
| @qa-seo | No aplica TDD; su "rojo-verde" es el bug reportado → fix verificado | E2E / regresión |

### 6.4 Criterios de aceptación de la galería (ejemplo de AC aprobados)

Referencia para la prioridad #1 del proyecto (la galería interactiva). @interactivity debe proponer AC ampliados sobre esta base, aprobados por @tech-lead:

```gherkin
Dado un usuario en la ficha de un vehículo
Cuando hace click en cualquier imagen de la galería
Entonces se abre un lightbox fullscreen con transición suave (≤250 ms, respetando prefers-reduced-motion)

Cuando el lightbox está abierto
Y el usuario presiona las flechas ← / →
Entonces navega entre imágenes adyacentes sin recargar ni ver fondo negro (preloaded)

Cuando el lightbox está abierto
Y el usuario hace swipe (táctil) o presiona Esc
Entonces navega o cierra el lightbox devolviendo el foco al elemento de origen

Cuando el usuario activa un filtro de categoría (p. ej. "Cocina")
Entonces solo se muestran las imágenes de esa categoría

Cuando el usuario navega al slide del plano de planta
Entonces puede ampliarlo (zoom) y volver a la vista normal

Verificación técnica: role="dialog", focus trap, aria-label por imagen,
LCP de la ficha sin regresión (> penalización de 100 ms), JS de la isla dentro del presupuesto.
```

### 6.5 DoD (Definition of Done) — puerta única de cierre

Una tarea solo se da por terminada cuando el agente reporta, y @tech-lead confirma:

- [ ] Todos los AC en verde, con evidencia (salida de tests o pasos manuales)
- [ ] Suite completa pasando (unit + E2E smoke)
- [ ] `lint` y `astro check` limpios
- [ ] Mapping de cada entregable a secciones del SDD
- [ ] Cero dependencias nuevas sin justificación (y aprobadas si las hay)
- [ ] Archivos editados dentro del dominio de propiedad del agente
- [ ] Reporte `reports/<agente>/task-<id>.md` emitido

---

## 7. Fases de ejecución y matriz RACI

### 7.1 Secuencia de fases

```
Fase 0  ─  Planificación: @tech-lead descompone, define AC iniciales,
           escala al humano → APROBACIÓN HUMANO PARA ARRANCAR
Fase 1  ─  @foundation  (setup Astro/Supabase/CI/Vercel)      [secuencial]
Fase 2  ─  @ui-design + @catalog + @api-data                   [paralelo]
Fase 3  ─  @interactivity (galería primero)                    [secuencial]
Fase 4  ─  @qa-seo (auditoría integral) + fixes de fase        [secuencial]
           └─▶ APROBACIÓN HUMANO → launch
Fase 5  ─  @ops (mantenimiento) + @catalog (contenido)         [continuo]
```

**Regla de paralelismo**: en Fase 2, los tres agentes trabajan en dominios disjointos (§3 propiedad de archivos). Cualquier solapamiento de archivos → @tech-lead reasigna antes de asignar las tareas.

### 7.2 Matriz RACI

R = Responsable (ejecuta) · A = Aprueba (@tech-lead, o humano en hitos) · C = Consultado · I = Informado

| Actividad | @tech-lead | @foundation | @ui-design | @catalog | @interactivity | @api-data | @qa-seo | Humano |
|---|---|---|---|---|---|---|---|---|
| Descomponer alcance en tareas | **R** | I | I | I | I | I | I | A (hitos) |
| Setup infraestructura | A | **R** | I | I | I | C | C | I |
| Design system y tokens | A | C | **R** | C | C | – | C | I |
| Catálogo y páginas SSG | A | – | C | **R** | C | C | C | I |
| API endpoints y precios | A | C | – | C | C | **R** | C | – |
| Islas (galería, calendario, booking) | A | – | C | C | **R** | C | C | – |
| Aprobación de AC de tarea | **R/A** | – | – | – | – | – | C | – |
| Auditoría SDD por fase | A (dueño) | – | – | – | – | – | **R** (verifica) | I |
| E2E, performance, a11y | C | – | C | – | C | C | **R** | I |
| Desviaciones del SDD (ADRs) | **R** (propone) | – | – | – | – | – | C | **A** |
| Aprobación de transición de fase | R (consolida) | – | – | – | – | – | C (veredicto) | **A** |
| Launch a producción | R | C | – | – | – | – | C | **A** |
| Contenido post-launch | A | – | – | **R** | – | – | C | I |
| Mantenimiento (deps, monitoreo) | A | C | – | C | – | – | C | I |

---

## 8. Manejo de fallos y escalación

### 8.1 Protocolo por tipo de fallo

| Situación | Primer respondedor | Escalación | Tiempo objetivo |
|---|---|---|---|
| Tarea con > 2 intentos fallidos (loop AC/DC atascado) | El propio agente detiene y escala | @tech-lead decide: cambiar enfoque, dividir la tarea, o reasignar | misma sesión |
| Bug P1 en preview (rompe flujo principal) | @qa-seo reporta | @tech-lead asigna fix prioritario al dueño | ≤ 1 ciclo AC/DC |
| Conflicto de propiedad de archivos | Agentes involucrados lo reportan | @tech-lead dicta el dueño | inmediato |
| Dependencia rota / CI rojo | @qa-seo detecta | @foundation repara (prioridad alta) | ≤ 4 h hábiles |
| Cambio de alcance solicitado por el humano | @tech-lead reformula | re-planificación + reasignación; impacto reportado al humano | 1 sesión |
| Desviación necesaria del SDD | Agente afectado escala | @tech-lead evalúa → humano aprueba → ADR | antes de codificar |
| Supabase/Vercel cerca de límites del free tier | @ops o @qa-seo detectan | @tech-lead presenta opciones al humano (optimizar o escalar plan) | decisión humana |

### 8.2 Reconexión de contexto (sesiones nuevas)

Cuando un agente arranca una sesión sin contexto previo (o con contexto comprimido), debe:

1. Leer `TECHNICAL-SPEC.md` (secciones de su dominio) y `AGENT-TEAM-SPEC.md` (su ficha §3).
2. Leer su reporte de tarea más reciente en `reports/<agente>/`.
3. Leer `reports/decisions.md` (ADRs) para no reabrir decisiones cerradas.
4. Confirmar con @tech-lead cuál es su tarea activa antes de tocar código.

---

## 9. Mantenimiento post-launch

### 9.1 Cadencia

| Actividad | Frecuencia | Responsable |
|---|---|---|
| `npm audit` + bumps de patch | semanal | @ops |
| Revisión de builds fallidos en Vercel | por alerta | @ops → @foundation si requiere fix |
| Backup de Supabase (`pg_dump` de las 2 tablas) | semanal | @ops |
| Revisión de solicitudes `PENDING` > 7 días | semanal | @ops + humano (decisión) |
| Actualización de catálogo (vehículos/rutas/blog) | por demanda | @catalog (con checklist) |
| Auditoría Lighthouse + web vitals | mensual | @qa-seo |
| Actualización de majors de dependencias | trimestral (evaluar) | @ops → @tech-lead → humano |

### 9.2 Checklist de alta de vehículo (para @catalog)

1. Agregar JSON en `src/content/vehicles/` cumpliendo el schema Zod.
2. Colocar imágenes en `public/images/vehicles/<internalCode>/` con naming §13.2 del spec.
3. `npm run build` debe pasar (valida schema + unicidad de slug/código).
4. Si el vehículo tiene bloqueos iniciales, insertar en `availability_blocks` (seed SQL o dashboard).
5. Reporte mínimo a @tech-lead (o commit directo con PR si el humano lo prefiere).

---

## 10. Artefactos canónicos y registro de decisiones

### 10.1 Estructura de reportes

```
reports/
├── decisions.md                  # ADRs operativos y resoluciones de @tech-lead
├── escalations.md                # Escalaciones al humano y su resolución
├── tech-lead/
│   ├── phase-0-plan.md           # Descomposición de tareas por fase
│   └── status.md                 # Estado corriente del proyecto
├── foundation/
│   └── task-*.md
├── ui-design/
│   ├── design-guide.md           # Guía de uso del design system
│   └── task-*.md
├── catalog/
│   └── task-*.md
├── interactivity/
│   ├── gallery-acceptance-criteria.md
│   └── task-*.md
├── api-data/
│   ├── api-contracts.md          # Contratos firmados de los endpoints
│   └── task-*.md
├── qa/
│   ├── phase-1-report.md … phase-4-report.md
│   └── release-checklist.md
└── ops/
    └── weekly-*.md
```

### 10.2 Jerarquía de fuentes de verdad

1. **`TECHNICAL-SPEC.md` (SDD)** — arquitectura y contratos. Modificable solo vía ADR aprobado por el humano.
2. **`LANDING-PAGE.md`** — alcance de contenido y UX.
3. **`AGENT-TEAM-SPEC.md`** (este documento) — quién hace qué y cómo se comunica. Modificable vía decisión del humano.
4. **`reports/decisions.md`** — decisiones operativas del equipo.
5. **Reportes de tareas** — evidencia histórica.

---

> **Resumen de las dos preguntas abiertas, cerradas**:
>
> - **¿Quién cumple el SDD?** @tech-lead lo **posee y aprueba** (gate en cada tarea + registro de ADRs); @qa-seo lo **verifica independientemente** por fase y puede bloquear; todos los agentes **mapean sus entregables** a secciones del spec en sus reportes. Toda desviación pasa por el humano.
> - **¿Quién ejecuta el TDD con loop AC/DC?** Cada agente de construcción (@catalog, @api-data, @interactivity, @foundation) lo ejecuta **dentro de sus propias tareas** (Agent Centric): propone AC → @tech-lead aprueba → red → green → refactor → Check → DoD. @qa-seo verifica la evidencia del loop en auditoría; @tech-lead valida el cierre.
