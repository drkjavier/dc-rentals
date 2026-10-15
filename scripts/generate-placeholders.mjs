// scripts/generate-placeholders.mjs
// Genera placeholders SVG para hero, vehículos, rutas y floorplans.
// Convención §13.2 del SDD: /public/images/vehicles/<internalCode>/<categoria>-NN.svg
// Los placeholders se sustituyen por fotos reales sin tocar código.
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PUBLIC = join(ROOT, "public");

function svg({ w, h, from, to, label, glyph, textColor = "#1F2937" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g transform="translate(${w / 2} ${h / 2 - 30}) scale(2.6)" fill="none" stroke="${textColor}" stroke-opacity="0.35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
${glyph}
  </g>
  <text x="${w / 2}" y="${h / 2 + 90}" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="600" fill="${textColor}" fill-opacity="0.55" text-anchor="middle">${label}</text>
</svg>
`;
}

const GLYPHS = {
  exterior: `    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>`,
  kitchen: `    <path d="M3 2v7a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V2"/><path d="M6.5 2v20"/><path d="M17 2v20"/><path d="M17 12h4"/>`,
  bathroom: `    <path d="M4 12h16a1 1 0 0 1 1 1 7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7 1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h1"/><path d="M6 21v-2"/>`,
  bedroom: `    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/>`,
  living: `    <path d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H5z"/><path d="M3 13a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2"/><path d="M7 18v2"/><path d="M17 18v2"/>`,
  floorplan: `    <rect x="2" y="2" width="20" height="20" rx="1"/><path d="M2 10h9"/><path d="M11 2v20"/><path d="M16 10h6"/><path d="M16 16h6"/>`,
  hero: `    <path d="M3 18l4-8 4 5 3-6 4 9"/><path d="M14 7l3-4 4 6"/><path d="M2 21h20"/>`,
  route: `    <circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M8.5 16.5c2-3 3-5 5-7s3-3 5-3.5"/>`,
};

const VEHICLES = [
  {
    code: "DC-C3-001",
    images: [
      ["exterior-01", "exterior", "#1E40AF", "#3B82F6"],
      ["exterior-02", "exterior", "#1E40AF", "#60A5FA"],
      ["kitchen-01", "kitchen", "#059669", "#34D399"],
      ["bathroom-01", "bathroom", "#0891B2", "#22D3EE"],
      ["bedroom-01", "bedroom", "#7C3AED", "#A78BFA"],
      ["living-01", "living", "#D97706", "#FBBF24"],
      ["floorplan-01", "floorplan", "#374151", "#6B7280"],
    ],
  },
  {
    code: "DC-CB-002",
    images: [
      ["exterior-01", "exterior", "#1E40AF", "#3B82F6"],
      ["kitchen-01", "kitchen", "#059669", "#34D399"],
      ["bathroom-01", "bathroom", "#0891B2", "#22D3EE"],
      ["bedroom-01", "bedroom", "#7C3AED", "#A78BFA"],
      ["floorplan-01", "floorplan", "#374151", "#6B7280"],
    ],
  },
  {
    code: "DC-TT-003",
    images: [
      ["exterior-01", "exterior", "#1E40AF", "#3B82F6"],
      ["kitchen-01", "kitchen", "#059669", "#34D399"],
      ["bathroom-01", "bathroom", "#0891B2", "#22D3EE"],
      ["bedroom-01", "bedroom", "#7C3AED", "#A78BFA"],
      ["floorplan-01", "floorplan", "#374151", "#6B7280"],
    ],
  },
  {
    code: "DC-CA-004",
    images: [
      ["exterior-01", "exterior", "#1E40AF", "#3B82F6"],
      ["kitchen-01", "kitchen", "#059669", "#34D399"],
      ["bathroom-01", "bathroom", "#0891B2", "#22D3EE"],
      ["bedroom-01", "bedroom", "#7C3AED", "#A78BFA"],
      ["living-01", "living", "#D97706", "#FBBF24"],
      ["floorplan-01", "floorplan", "#374151", "#6B7280"],
    ],
  },
];

// Hero
mkdirSync(join(PUBLIC, "images", "hero"), { recursive: true });
writeFileSync(
  join(PUBLIC, "images", "hero", "hero-rv.svg"),
  svg({
    w: 1920,
    h: 1080,
    from: "#0F172A",
    to: "#1E3A8A",
    label: "DC Rentals — Explore Canada",
    glyph: GLYPHS.hero,
    textColor: "#F9FAFB",
  })
);

// Rutas
mkdirSync(join(PUBLIC, "images", "routes"), { recursive: true });
for (const name of ["rocky-mountains", "vancouver-island", "quebec-maritime"]) {
  writeFileSync(
    join(PUBLIC, "images", "routes", `${name}.svg`),
    svg({
      w: 1200,
      h: 630,
      from: "#065F46",
      to: "#059669",
      label: name.replace(/-/g, " "),
      glyph: GLYPHS.route,
      textColor: "#F9FAFB",
    })
  );
}

// Vehículos
for (const vehicle of VEHICLES) {
  const dir = join(PUBLIC, "images", "vehicles", vehicle.code);
  mkdirSync(dir, { recursive: true });
  for (const [name, glyph, from, to] of vehicle.images) {
    writeFileSync(
      join(dir, `${name}.svg`),
      svg({
        w: 800,
        h: 600,
        from,
        to,
        label: `${vehicle.code} · ${name.replace(/-/g, " ")}`,
        glyph: GLYPHS[glyph],
        textColor: "#F9FAFB",
      })
    );
  }
}

// Floorplans (referenciados por floorPlanSvg de cada vehículo)
mkdirSync(join(PUBLIC, "floorplans"), { recursive: true });
for (const vehicle of VEHICLES) {
  const slug = vehicle.code.toLowerCase().replace(/-/g, "-");
  writeFileSync(
    join(PUBLIC, "floorplans", `${slug}.svg`),
    svg({
      w: 1000,
      h: 600,
      from: "#E5E7EB",
      to: "#D1D5DB",
      label: `${vehicle.code} floor plan`,
      glyph: GLYPHS.floorplan,
      textColor: "#374151",
    })
  );
}

console.log("✅ Placeholders generated.");
