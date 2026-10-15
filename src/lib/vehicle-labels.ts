// src/lib/vehicle-labels.ts — Etiquetas de tipos de RV por idioma
import type { VehicleType, VehicleStatus } from "@/lib/content-schemas";
import type { Locale } from "@/lib/i18n";

export const TYPE_LABELS: Record<Locale, Record<VehicleType, string>> = {
  en: {
    CLASS_A: "Class A Motorhome",
    CLASS_B: "Class B Motorhome",
    CLASS_C: "Class C Motorhome",
    TRAVEL_TRAILER: "Travel Trailer",
    FIFTH_WHEEL: "Fifth Wheel",
    TRUCK_CAMPER: "Truck Camper",
    CAMPER_VAN: "Camper Van",
  },
  fr: {
    CLASS_A: "Camping-car classe A",
    CLASS_B: "Camping-car classe B",
    CLASS_C: "Camping-car classe C",
    TRAVEL_TRAILER: "Remolque de voyage",
    FIFTH_WHEEL: "Cinquième roue",
    TRUCK_CAMPER: "Camper de camionnette",
    CAMPER_VAN: "Van aménagé",
  },
};

export const STATUS_LABEL_KEYS: Record<VehicleStatus, string> = {
  AVAILABLE: "common.status_available",
  OCCUPIED: "common.status_occupied",
  MAINTENANCE: "common.status_maintenance",
  PARTIALLY_BOOKED: "common.status_partial",
  COMING_SOON: "common.status_coming_soon",
};

export const STATUS_TONES: Record<VehicleStatus, string> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  PARTIALLY_BOOKED: "partial",
  COMING_SOON: "upcoming",
};
