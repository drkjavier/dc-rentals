#language: es
Feature: Navegación e internacionalización (EN/FR)
  Como visitante del sitio (Canadá es bilingüe)
  Quiero que el sitio me muestre contenido en mi idioma (EN o FR)
  Para leer la información en mi idioma preferido

  Background:
    Dado que el sitio soporta los idiomas "en" y "fr"
    Y la ruta por defecto es "/en"

  Escenario: La raíz redirige según Accept-Language (inglés)
    Cuando visito "/" con header Accept-Language "en-CA,en;q=0.9"
    Entonces soy redirigido a "/en"

  Escenario: La raíz redirige según Accept-Language (francés)
    Cuando visito "/" con header Accept-Language "fr-CA,fr;q=0.9,en;q=0.8"
    Entonces soy redirigido a "/fr"

  Escenario: La raíz usa inglés por defecto si no hay preferencia
    Cuando visito "/" sin header Accept-Language
    Entonces soy redirigido a "/en"

  Escenario: Las rutas del catálogo se localizan en francés
    Dado que estoy en "/en/vehicles"
    Cuando cambio el idioma a "fr"
    Entonces navego a "/fr/vehicules"

  Escenario: Páginas disponibles en ambos idiomas
    Cuando visito "/en/faq" y "/fr/faq"
    Entonces ambas páginas renderizan correctamente
    Y existen tags hreflang que enlazan la versión alternativa de cada página

  Escenario: Idioma no soportado
    Cuando visito "/de/vehicles"
    Entonces recibo un error 404
