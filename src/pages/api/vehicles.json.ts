// src/pages/api/vehicles.json.ts — SDD §8.1
// Devuelve el catálogo completo como JSON para los filtros del island.
import type { APIRoute } from "astro";
import { getVehiclesForApi } from "@/lib/content";

export const prerender = false; // ← obligatorio: fuerza serverless

export const GET: APIRoute = async () => {
  const vehicles = await getVehiclesForApi();

  return new Response(JSON.stringify(vehicles), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300", // 5 min (§9.1)
    },
  });
};
