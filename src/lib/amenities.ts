// src/lib/amenities.ts — Catálogo estático de amenidades (MVP)
// Cada vehículo referencia estos ids en su campo `amenities[]`.
export type AmenityCategory =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "living"
  | "climate"
  | "systems"
  | "entertainment"
  | "safety";

export interface AmenityDef {
  id: string;
  name: string;
  nameFr: string;
  category: AmenityCategory;
}

export const AMENITY_CATALOG: Record<string, AmenityDef> = {
  fridge: { id: "fridge", name: "Refrigerator", nameFr: "Réfrigérateur", category: "kitchen" },
  "three-burner-stove": { id: "three-burner-stove", name: "3-burner stove", nameFr: "Cuisinière 3 brûleurs", category: "kitchen" },
  microwave: { id: "microwave", name: "Microwave", nameFr: "Four à micro-ondes", category: "kitchen" },
  "convection-oven": { id: "convection-oven", name: "Convection oven", nameFr: "Four à convection", category: "kitchen" },
  "double-sink": { id: "double-sink", name: "Double sink", nameFr: "Évier double", category: "kitchen" },
  "full-bath": { id: "full-bath", name: "Full bathroom with shower", nameFr: "Salle de bain complète avec douche", category: "bathroom" },
  "porcelain-toilet": { id: "porcelain-toilet", name: "Porcelain toilet", nameFr: "Toilette en porcelaine", category: "bathroom" },
  "glass-shower": { id: "glass-shower", name: "Glass shower door", nameFr: "Douche avec porte en verre", category: "bathroom" },
  "queen-bed": { id: "queen-bed", name: "Queen bed", nameFr: "Lit double", category: "bedroom" },
  "king-bed": { id: "king-bed", name: "King bed", nameFr: "Lit king", category: "bedroom" },
  "cabover-bunk": { id: "cabover-bunk", name: "Cabover bunk", nameFr: "Couchette au-dessus de la cabine", category: "bedroom" },
  "sofa-bed": { id: "sofa-bed", name: "Sofa bed", nameFr: "Canapé-lit", category: "bedroom" },
  "dinette-convertible": { id: "dinette-convertible", name: "Convertible dinette", nameFr: "Table convertible", category: "bedroom" },
  "bunk-beds": { id: "bunk-beds", name: "Bunk beds", nameFr: "Lits superposés", category: "bedroom" },
  tv: { id: "tv", name: "LED TV", nameFr: "Téléviseur LED", category: "entertainment" },
  "bluetooth-stereo": { id: "bluetooth-stereo", name: "Bluetooth stereo", nameFr: "Chaîne stéréo Bluetooth", category: "entertainment" },
  "theater-seating": { id: "theater-seating", name: "Theater seating", nameFr: "Sièges cinéma", category: "living" },
  fireplace: { id: "fireplace", name: "Electric fireplace", nameFr: "Cheminée électrique", category: "living" },
  "ac-13500": { id: "ac-13500", name: "A/C 13,500 BTU", nameFr: "Climatisation 13 500 BTU", category: "climate" },
  "ac-15000": { id: "ac-15000", name: "A/C 15,000 BTU", nameFr: "Climatisation 15 000 BTU", category: "climate" },
  "propane-heat": { id: "propane-heat", name: "Propane heating", nameFr: "Chauffage propane", category: "climate" },
  "water-heater": { id: "water-heater", name: "Water heater", nameFr: "Chauffe-eau", category: "climate" },
  "30-amp": { id: "30-amp", name: "30 amp electrical", nameFr: "Service électrique 30 amp", category: "systems" },
  "50-amp": { id: "50-amp", name: "50 amp electrical", nameFr: "Service électrique 50 amp", category: "systems" },
  "generator-4000": { id: "generator-4000", name: "4,000W generator", nameFr: "Générateur 4 000 W", category: "systems" },
  "generator-5500": { id: "generator-5500", name: "5,500W generator", nameFr: "Générateur 5 500 W", category: "systems" },
  "solar-panels": { id: "solar-panels", name: "Solar panels", nameFr: "Panneaux solaires", category: "systems" },
  "lithium-battery": { id: "lithium-battery", name: "Lithium batteries", nameFr: "Batteries au lithium", category: "systems" },
  "smoke-detector": { id: "smoke-detector", name: "Smoke detector", nameFr: "Détecteur de fumée", category: "safety" },
  "co-detector": { id: "co-detector", name: "Carbon monoxide detector", nameFr: "Détecteur de monoxyde de carbone", category: "safety" },
  "fire-extinguisher": { id: "fire-extinguisher", name: "Fire extinguisher", nameFr: "Extincteur", category: "safety" },
  "backup-camera": { id: "backup-camera", name: "Backup camera", nameFr: "Caméra de recul", category: "safety" },
  "roadside-kit": { id: "roadside-kit", name: "Roadside assistance kit", nameFr: "Kit d'assistance routière", category: "safety" },
  "first-aid-kit": { id: "first-aid-kit", name: "First aid kit", nameFr: "Trousse de premiers soins", category: "safety" },
};

export function getAmenityDef(id: string): AmenityDef | undefined {
  return AMENITY_CATALOG[id];
}

export const AMENITY_CATEGORY_ORDER: AmenityCategory[] = [
  "kitchen",
  "bathroom",
  "bedroom",
  "living",
  "climate",
  "systems",
  "entertainment",
  "safety",
];
