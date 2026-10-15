// src/lib/content-schemas.ts
// SDD: TECHNICAL-SPEC.md §4.1 — schemas Zod de Content Collections.
// Nota operativa (reports/decisions.md): los schemas viven aquí (no inline en
// content.config.ts) para que sean importables por los tests unitarios de
// Vitest, que no pueden resolver el módulo `astro:content`.
import { z } from "zod";

export const vehicleType = z.enum([
  "CLASS_A",
  "CLASS_B",
  "CLASS_C",
  "TRAVEL_TRAILER",
  "FIFTH_WHEEL",
  "TRUCK_CAMPER",
  "CAMPER_VAN",
]);

export const vehicleStatus = z.enum([
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "PARTIALLY_BOOKED",
  "COMING_SOON",
]);

export const vehicleSpecsSchema = z.object({
  // Dimensiones exteriores
  lengthM: z.number(),
  lengthFt: z.string(), // "26 ft 8 in"
  widthM: z.number(),
  widthIn: z.number(),
  heightM: z.number(),
  heightFt: z.string(),
  // Dimensiones interiores
  interiorHeightM: z.number(),
  interiorHeightFt: z.string(),
  areaSqm: z.number(),
  areaSqft: z.number(),
  slideOuts: z.number().default(0),
  // Tanques (galones + litros)
  freshWaterGal: z.number(),
  grayWaterGal: z.number(),
  blackWaterGal: z.number(),
  freshWaterL: z.number(),
  grayWaterL: z.number(),
  blackWaterL: z.number(),
  fuelCapacityGal: z.number(),
  fuelCapacityL: z.number(),
  // Peso
  gvwrLbs: z.number(),
  gvwrKg: z.number(),
  towingCapacityLbs: z.number().optional(),
  towingCapacityKg: z.number().optional(),
  // Motor
  chassis: z.string(),
  engine: z.string(),
  transmission: z.string(),
  fuelType: z.string(),
  mpg: z.string(), // "8-12"
  mpgL100km: z.string(), // "29-19"
  drivetrain: z.string().optional(),
  // Generador
  generatorWatts: z.number().optional(),
  generatorHoursInc: z.number().optional(),
  // Exterior
  awningType: z.string().optional(),
  awningLengthFt: z.string().optional(),
  awningLengthM: z.number().optional(),
  exteriorShower: z.boolean().default(false),
  exteriorGrill: z.boolean().default(false),
  backupCamera: z.boolean().default(false),
  bikeRack: z.boolean().default(false),
  levelingJacks: z.string().optional(),
});

export const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  altFr: z.string().optional(),
  category: z.enum([
    "EXTERIOR",
    "KITCHEN",
    "BATHROOM",
    "BEDROOM",
    "LIVING",
    "FLOORPLAN",
    "DETAIL",
  ]),
  sortOrder: z.number().default(0),
});

export const amenitySchema = z.object({
  id: z.string(), // id de la amenidad (catálogo estático)
  detail: z.string().optional(),
  detailFr: z.string().optional(),
});

export const vehicleSchema = z.object({
  internalCode: z.string().regex(/^DC-[A-Z0-9]+-\d+$/), // "DC-C3-001"
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  type: vehicleType,
  status: vehicleStatus.default("AVAILABLE"),
  description: z.string(),
  descriptionFr: z.string(),
  // Capacidad
  sleepCapacity: z.number(),
  seatBelts: z.number(),
  petFriendly: z.boolean().default(false),
  // Precios (CAD)
  pricePerNightCAD: z.number(),
  priceLowSeasonCAD: z.number().optional(),
  priceHighSeasonCAD: z.number().optional(),
  pricePeakSeasonCAD: z.number().optional(),
  securityDepositCAD: z.number().default(1000),
  // Ubicación (referencia a datos estáticos de location)
  locationId: z.string(),
  // Media
  mainImage: z.string(),
  floorPlanSvg: z.string().optional(),
  images: z.array(imageSchema).default([]),
  specs: vehicleSpecsSchema,
  amenities: z.array(amenitySchema).default([]),
  // Metadata
  availableFromDate: z.coerce.date().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const routeSchema = z.object({
  locale: z.enum(["en", "fr"]),
  name: z.string(),
  description: z.string(),
  distance: z.string(), // "2,800 km"
  duration: z.string(), // "7-10 days"
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  bestSeason: z.string(),
  image: z.string(),
  stops: z.array(
    z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
      description: z.string().optional(),
    })
  ),
  highlights: z.array(z.string()),
  regionIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const blogSchema = z.object({
  locale: z.enum(["en", "fr"]),
  title: z.string(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  author: z.string().default("DC Rentals"),
  image: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const faqSchema = z.object({
  id: z.string(),
  locale: z.enum(["en", "fr"]),
  category: z.string(),
  question: z.string(),
  answer: z.string(),
  sortOrder: z.number().default(0),
});

export type VehicleType = z.infer<typeof vehicleType>;
export type VehicleStatus = z.infer<typeof vehicleStatus>;
export type VehicleSpecs = z.infer<typeof vehicleSpecsSchema>;
export type VehicleImage = z.infer<typeof imageSchema>;
export type VehicleAmenity = z.infer<typeof amenitySchema>;
export type VehicleData = z.infer<typeof vehicleSchema>;
export type RouteData = z.infer<typeof routeSchema>;
export type BlogData = z.infer<typeof blogSchema>;
export type FaqData = z.infer<typeof faqSchema>;
