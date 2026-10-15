#language: es
Feature: Landing page principal
  Como visitante potencial de DC Rentals
  Quiero entender la propuesta de valor y ver unidades destacadas
  Para decidir si exploro el catálogo de RVs

  Background:
    Dado que el catálogo contiene al menos 4 vehículos de ejemplo
    Y visito la página de inicio "/en"

  Escenario: Hero con propuesta de valor y CTA
    Entonces veo el headline principal "Explore Canada in Your Home on Wheels"
    Y veo un CTA hacia el catálogo ("View Available Fleet")
    Y veo el contador de unidades disponibles ("{count} RVs available")

  Escenario: Secciones de la landing
    Cuando hago scroll por la página
    Entonces veo la sección "Cómo funciona" con 3 pasos
    Y veo las unidades destacadas (vehículos con featured=true)
    Y veo las rutas populares
    Y veo la sección de FAQ
    Y veo un CTA final hacia el catálogo

  Escenario: Landing bilingüe
    Cuando visito "/fr"
    Entonces el contenido de la landing está en francés

  Escenario: Contenido sin JS (SEO)
    Entonces las secciones de la landing son HTML estático renderizado en build
    Y la página incluye metadata title y description

  Escenario (triste): Página desconocida
    Cuando visito "/en/no-existe"
    Entonces recibo un error 404 con navegación de vuelta al inicio
