# language: es
Feature: Upgrade de Astro 4.16 a Astro 5.x con @astrojs/vercel@9
  Como desarrollador del proyecto DC Rentals
  Quiero migrar el proyecto a Astro 5 y al adaptador Vercel 9
  Para que Vercel acepte el despliegue con un runtime válido (nodejs22.x)

  Background:
    Dado que el proyecto usa Astro 4.16 y @astrojs/vercel@7.8.2
    Y el adaptador v7 emite runtime "nodejs18.x" que Vercel ya no acepta
    Y el proyecto ya usa Content Layer API (glob loader) en src/content.config.ts

  @happy-path
  Escenario: Build completo genera funciones serverless con runtime válido
    Cuando ejecuto "npm run build"
    Entonces el build finaliza sin errores
    Y la función serverless en .vercel/output genera .vc-config.json
    Y el campo "runtime" del .vc-config.json es "nodejs22.x"

  @happy-path
  Escenario: Configuración Astro 5 sin output hybrid
    Dado que "output: 'hybrid'" fue eliminado en Astro 5
    Cuando astro.config.mjs define el adaptador Vercel sin output hybrid
    Entonces las rutas con "export const prerender = false" siguen siendo serverless
    Y las páginas estáticas se generan igualmente en prerendering

  @happy-path
  Escenario: Content Collections siguen funcionando
    Dado que las colecciones ya usan glob() loader de Content Layer API
    Cuando ejecuto el build
    Entonces las colecciones vehicles, routes, blog y faq se generan correctamente
    Y las páginas prerendered de vehicles, routes, itinerarios y faq se construyen

  @happy-path
  Escenario: Tests y type-check pasan tras el upgrade
    Cuando ejecuto "npm run test" y "npm run type-check" y "npm run lint"
    Entonces todos los comandos finalizan sin errores

  @sad-path
  Escenario: Uso de APIs eliminadas en Astro 5
    Dado que el proyecto no usa Astro.glob(), ViewTransitions, functionPerRoute ni prerender dinámico
    Cuando realizo la migración
    Entonces no hay cambios de código necesarios más allá de package.json y astro.config.mjs

  @sad-path
  Escenario: Endpoints API POST con CSRF protection por defecto
    Dado que Astro 5 activa security.checkOrigin por defecto
    Cuando se envían requests POST JSON a /api/reservations desde el mismo origen
    Entonces las requests no son rechazadas (checkOrigin aplica a páginas on-demand, no a endpoints API)
