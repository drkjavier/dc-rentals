// src/lib/locations.ts — Datos estáticos de ubicaciones de pickup (MVP)
// SDD §9.2 (entidad Location) — vive en código hasta que migre a BD.
export interface Location {
  id: string;
  name: string;
  city: string;
  province: string;
  provinceLabelEn: string;
  provinceLabelFr: string;
  phone: string;
  pickupHours: string;
  lat: number;
  lng: number;
}

export const LOCATIONS: Location[] = [
  {
    id: "calgary-depot",
    name: "Calgary Depot",
    city: "Calgary",
    province: "AB",
    provinceLabelEn: "Alberta",
    provinceLabelFr: "Alberta",
    phone: "+1-403-555-0101",
    pickupHours: "Mon–Sat 8:00–18:00",
    lat: 51.0447,
    lng: -114.0719,
  },
  {
    id: "vancouver-depot",
    name: "Vancouver Depot",
    city: "Vancouver",
    province: "BC",
    provinceLabelEn: "British Columbia",
    provinceLabelFr: "Colombie-Britannique",
    phone: "+1-604-555-0102",
    pickupHours: "Mon–Sat 8:00–18:00",
    lat: 49.2827,
    lng: -123.1207,
  },
  {
    id: "toronto-depot",
    name: "Toronto Depot",
    city: "Toronto",
    province: "ON",
    provinceLabelEn: "Ontario",
    provinceLabelFr: "Ontario",
    phone: "+1-416-555-0103",
    pickupHours: "Mon–Sat 8:00–18:00",
    lat: 43.6532,
    lng: -79.3832,
  },
  {
    id: "montreal-depot",
    name: "Montréal Depot",
    city: "Montréal",
    province: "QC",
    provinceLabelEn: "Quebec",
    provinceLabelFr: "Québec",
    phone: "+1-514-555-0104",
    pickupHours: "Mon–Sam 8:00–18:00",
    lat: 45.5017,
    lng: -73.5673,
  },
];

export function getLocationById(id: string): Location | undefined {
  return LOCATIONS.find((l) => l.id === id);
}
