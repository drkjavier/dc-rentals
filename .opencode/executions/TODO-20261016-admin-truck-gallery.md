# TODO — Galería de fotos por truck (panel admin)

- **Feature:** feat/admin-truck-gallery
- **Fecha:** 2026-10-16
- **Metodología:** SDD + TDD (GGVR)
- **Spec:** docs/gherkin/admin-truck-gallery.feature

## Resumen de diseño
El schema `vehicleSchema` ya incluye `images: z.array(imageSchema)` y el frontend
público (`image-gallery.tsx`) ya renderiza la galería. El endpoint upload
(`/api/admin/upload`) y `fileToBase64` ya existen. Solo falta la UI en el panel.

**Decisiones del usuario:**
1. `mainImage` se conserva como campo separado (la galería es una sección nueva).
2. Categoría `EXTERIOR` por defecto al subir, editable con desplegable.
3. Límite de 12 fotos por truck.

## Tareas

| ID | Nombre | Descripción | Consideraciones | Estado | Timestamp | Agente |
|----|--------|-------------|-----------------|--------|-----------|--------|
| T1 | Constantes y tipos de galería | Añadir `AdminGalleryImage`, `IMAGE_CATEGORIES`, `MAX_GALLERY_IMAGES` y importar `fileToBase64`/`ChangeEvent` | Reutilizar enums del imageSchema | completada | 2026-10-16 | orchestrator |
| T2 | Componente GalleryManager | Subcomponente con thumbnails, upload multiarchivo, edición de alt/altFr/category, borrar, reordenar y "Hacer principal" | Límite 12; categoría EXTERIOR por defecto; sortOrder por índice | completada | 2026-10-16 | orchestrator |
| T3 | Integrar en VehicleForm | Renderizar GalleryManager dentro de VehicleForm y enlazar con `onChange("images", arr)` | No romper mainImage existente | completada | 2026-10-16 | orchestrator |
| T4 | Verificación | type-check, lint y build del proyecto | Sin regresiones en panel admin | completada | 2026-10-16 | orchestrator |

## Resultados de verificación (VERIFY)
- `npm run type-check`: ✅ 0 errores
- `npm run lint`: ✅ 0 errores
- `npm run build`: ✅ Completado
- `npm run test`: ✅ 163/163 tests pasan (los warnings de zustand persist son preexistentes, entorno jsdom sin localStorage)
