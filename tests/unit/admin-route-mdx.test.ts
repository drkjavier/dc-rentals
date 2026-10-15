// tests/unit/admin-route-mdx.test.ts — ADR-020
// Parseo y serialización de rutas MDX (frontmatter YAML + cuerpo markdown):
// roundtrip idempotente y manejo de archivos malformados.
import { describe, it, expect } from "vitest";
import { parseRouteMdx, serializeRouteMdx } from "@/lib/admin/route-mdx";

const SAMPLE = `---
locale: "en"
name: "Rocky Mountains Loop"
distance: "2,800 km"
difficulty: "moderate"
stops:
  - name: "Calgary"
    lat: 51.0447
    lng: -114.0719
  - name: "Banff"
    lat: 51.1784
    lng: -115.5708
highlights:
  - "Icefields Parkway"
  - "Lake Louise"
active: true
---

# Rocky Mountains Loop

Start in Calgary, cross the Continental Divide at Banff.
`;

describe("parseRouteMdx", () => {
  it("separa frontmatter y body", () => {
    const { data, body } = parseRouteMdx(SAMPLE);
    expect(data.name).toBe("Rocky Mountains Loop");
    expect(data.difficulty).toBe("moderate");
    expect(data.active).toBe(true);
    expect(body).toContain("# Rocky Mountains Loop");
  });

  it("parsea stops como array de objetos con lat/lng numéricos", () => {
    const { data } = parseRouteMdx(SAMPLE);
    const stops = data.stops as Array<{ name: string; lat: number }>;
    expect(stops).toHaveLength(2);
    expect(stops[0].name).toBe("Calgary");
    expect(stops[0].lat).toBeCloseTo(51.0447);
  });

  it("lanza si no hay frontmatter", () => {
    expect(() => parseRouteMdx("# Solo markdown\n")).toThrow(/frontmatter/);
  });

  it("lanza si el frontmatter no es un objeto YAML", () => {
    expect(() => parseRouteMdx("---\n- uno\n- dos\n---\nbody")).toThrow(/objeto YAML/);
  });
});

describe("serializeRouteMdx", () => {
  it("roundtrip: parse(serialize(data, body)) conserva datos y body", () => {
    const original = parseRouteMdx(SAMPLE);
    const serialized = serializeRouteMdx(original.data, original.body);
    const reparsed = parseRouteMdx(serialized);

    expect(reparsed.data.name).toBe(original.data.name);
    expect(reparsed.data.difficulty).toBe(original.data.difficulty);
    expect((reparsed.data.stops as unknown[]).length).toBe(
      (original.data.stops as unknown[]).length
    );
    expect(reparsed.body.trim()).toBe(original.body.trim());
  });

  it("el resultado siempre empieza por frontmatter ---", () => {
    const out = serializeRouteMdx({ name: "Test", locale: "fr" }, "Cuerpo");
    expect(out.startsWith("---\n")).toBe(true);
    expect(out).toContain("Cuerpo");
  });

  it("serialización idempotente (serialize de serialize = mismo output)", () => {
    const { data, body } = parseRouteMdx(SAMPLE);
    const once = serializeRouteMdx(data, body);
    const twice = serializeRouteMdx(parseRouteMdx(once).data, parseRouteMdx(once).body);
    expect(twice).toBe(once);
  });

  it("limpia un BOM inicial del body", () => {
    const out = serializeRouteMdx({ name: "X" }, "\uFEFFHola");
    expect(out).not.toContain("\uFEFF");
    expect(out).toContain("Hola");
  });
});
