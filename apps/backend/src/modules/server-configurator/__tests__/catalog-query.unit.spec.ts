import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  buildCatalogRecord,
  CatalogFilterDefinition,
  executeCatalogQuery,
  parseCatalogQuery,
  propertyCatalogDefinitions,
  normalizePropertyValue,
  SYSTEM_CATALOG_FILTERS,
  validateCatalogPropertyIndex,
} from "../catalog-query"

const definitions = SYSTEM_CATALOG_FILTERS.filter((definition) =>
  ["brand", "family", "max_cpu", "drive_bays_total", "price", "availability"].includes(definition.key),
)

function record(slug: string, input: Record<string, any> = {}) {
  return buildCatalogRecord({
    model: {
      id: slug,
      slug,
      public_name: input.public_name || slug,
      brand: input.brand || "HPE",
      family: input.family || "ProLiant",
      generation: input.generation || "Gen10",
      model: input.model || slug,
      form_factor: input.form_factor || "1U",
      chassis_type: input.chassis_type || "8SFF",
      cpu_socket: input.cpu_socket || "LGA3647",
      max_cpu: input.max_cpu ?? 2,
      ram_slots_total: input.ram_slots_total ?? 24,
      supported_ram_types: input.supported_ram_types || ["DDR4"],
      supported_drive_interfaces: input.supported_drive_interfaces || ["SAS", "SATA"],
      drive_bays_front: input.drive_bays_front ?? 8,
      drive_bays_rear: input.drive_bays_rear ?? 0,
      created_at: input.created_at || "2026-01-01T00:00:00.000Z",
    },
    effective_properties: input.effective_properties,
    commerce: {
      price: input.price ?? 1000,
      availability: input.availability || "in_stock",
      categories: input.categories || ["servers"],
      condition: input.condition ?? null,
    },
  })
}

function query(raw: Record<string, unknown>, schema = definitions) {
  const parsed = parseCatalogQuery(raw, schema)
  expect(parsed.errors).toEqual([])
  return parsed.query!
}

describe("backend catalog query", () => {
  it("combines filters with AND and values within one facet with OR", () => {
    const records = [
      record("hpe-a", { brand: "HPE", family: "ProLiant", max_cpu: 2 }),
      record("dell-a", { brand: "Dell", family: "PowerEdge", max_cpu: 2 }),
      record("dell-b", { brand: "Dell", family: "PowerEdge", max_cpu: 1 }),
    ]
    const result = executeCatalogQuery({
      records,
      definitions,
      query: query({ brand: ["HPE", "Dell"], family: "PowerEdge", "max_cpu.min": "2" }),
    })
    expect(result.items.map((item) => item.slug)).toEqual(["dell-a"])
  })

  it("returns disjunctive backend counts while preserving other active filters", () => {
    const records = [
      record("hpe", { brand: "HPE", family: "ProLiant" }),
      record("dell", { brand: "Dell", family: "PowerEdge" }),
      record("lenovo", { brand: "Lenovo", family: "ThinkSystem" }),
    ]
    const result = executeCatalogQuery({
      records,
      definitions,
      query: query({ brand: "HPE", family: "ProLiant" }),
    })
    expect(result.total).toBe(1)
    expect(result.facets.find((facet) => facet.key === "brand")?.values).toEqual([
      expect.objectContaining({ value: "HPE", count: 1 }),
    ])
    expect(result.facets.find((facet) => facet.key === "family")?.values).toEqual([
      expect.objectContaining({ value: "ProLiant", count: 1 }),
    ])
  })

  it("supports ranges, high pages, empty data and deterministic page boundaries", () => {
    const records = [
      record("z", { price: 900, drive_bays_front: 4 }),
      record("a", { price: 1100, drive_bays_front: 8 }),
      record("m", { price: 1300, drive_bays_front: 12 }),
    ]
    const filtered = executeCatalogQuery({
      records,
      definitions,
      query: query({ price_min: "1000", price_max: "1400", bays_min: "8", sort: "price_asc", limit: "1", page: "2" }),
    })
    expect(filtered.total).toBe(2)
    expect(filtered.items[0].slug).toBe("m")
    expect(executeCatalogQuery({ records, definitions, query: query({ page: "999" }) }).items).toEqual([])
    expect(executeCatalogQuery({ records: [], definitions, query: query({}) }).total).toBe(0)
  })

  it("loads only explicitly selected slugs for compare and favorites", () => {
    const records = [record("hpe-dl360"), record("dell-r640", { brand: "Dell" }), record("lenovo-sr630", { brand: "Lenovo" })]
    const parsed = query({ slugs: "dell-r640,hpe-dl360", limit: "4" })
    const result = executeCatalogQuery({ records, definitions, query: parsed })
    expect(result.items.map((item) => item.slug).sort()).toEqual(["dell-r640", "hpe-dl360"])
    expect(parseCatalogQuery({ slugs: Array.from({ length: 49 }, (_, index) => `server-${index}`) }, definitions).errors.join(" ")).toContain("at most 48")
  })

  it.each([
    [{ page: "0" }, "page"],
    [{ limit: "49" }, "limit"],
    [{ sort: "random" }, "sort"],
    [{ imaginary: "yes" }, "unsupported filter"],
    [{ price_min: "ten" }, "numeric"],
    [{ price_min: "20", price_max: "10" }, "minimum"],
  ])("rejects invalid input %#", (raw, fragment) => {
    expect(parseCatalogQuery(raw, definitions).errors.join(" ")).toContain(fragment)
  })

  it("publishes only active filterable registry definitions with concept labels and aliases", () => {
    const dynamic = propertyCatalogDefinitions([
      { id: "p1", key: "cpu.generation", label: "CPU generation", value_type: "reference", filterable: true, lifecycle_status: "active", usage_status: "filterable", allowed_values_json: ["c1"], schema_version: 3 },
      { id: "p2", key: "secret", label: "Secret", value_type: "text", filterable: false, lifecycle_status: "active" },
      { id: "p3", key: "old", label: "Old", value_type: "text", filterable: true, lifecycle_status: "deprecated" },
    ], [{ id: "c1", display_name: "Intel Xeon 6" }], [{ technology_concept_id: "c1", alias: "Granite Rapids" }])
    expect(dynamic).toEqual([
      expect.objectContaining({ key: "attr.cpu.generation", schema_version: 3, options: [{ value: "c1", label: "Intel Xeon 6", aliases: ["Granite Rapids"] }] }),
    ])
    expect(parseCatalogQuery({ "attr.cpu.generation": "Granite Rapids" }, dynamic).query?.filters).toEqual({
      "attr.cpu.generation": ["c1"],
    })
  })

  it("returns provenance for effective inherited properties", () => {
    const item = record("with-provenance", {
      effective_properties: [{ key: "cpu.generation", value: "c1", source_scope: "server_family", source_id: "family-1" }],
    })
    expect(item.provenance["attr.cpu.generation"]).toEqual({ scope: "server_family", source_id: "family-1" })
  })

  it("normalizes assigned units into the canonical backend unit", () => {
    expect(normalizePropertyValue(
      { value: 3200, unit: "MHz" },
      { value_type: "number", unit: "GHz" },
    )).toBe(3.2)
    expect(normalizePropertyValue(
      { value: 4, unit: "raw" },
      { value_type: "number", unit: "normalized", normalization_rule_json: { factor: 2, offset: 1 } },
    )).toBe(9)
  })

  it("reports registry backfill and orphan assignments", () => {
    const validation = validateCatalogPropertyIndex(
      [{ id: "p1", key: "cpu.generation", filterable: true, lifecycle_status: "active", usage_status: "filterable", value_type: "text", label: "Generation" }],
      [{ id: "a1", property_definition_id: "missing" }],
    )
    expect(validation.valid).toBe(false)
    expect(validation.requires_backfill).toEqual(["cpu.generation"])
    expect(validation.orphan_assignment_ids).toEqual(["a1"])
  })

  it("does not contain legacy synthetic commercial or hardware facets", () => {
    const source = readFileSync(join(__dirname, "..", "catalog-facets.ts"), "utf8")
    for (const fake of ["Под проект", "В наличии", "Восстановленный", "Intel Xeon Scalable", "~70 см", "1 год", "СДЭК"]) {
      expect(source).not.toContain(fake)
    }
  })

  it("keeps a 10k-record in-memory query within the seeded-volume budget", () => {
    const records = Array.from({ length: 10_000 }, (_, index) =>
      record(`server-${String(index).padStart(5, "0")}`, {
        brand: index % 2 ? "HPE" : "Dell",
        family: index % 2 ? "ProLiant" : "PowerEdge",
        price: 500 + index,
      }),
    )
    const started = performance.now()
    const result = executeCatalogQuery({ records, definitions, query: query({ brand: "HPE", price_min: "1000", limit: "48" }) })
    expect(result.total).toBeGreaterThan(4000)
    expect(result.items).toHaveLength(48)
    expect(performance.now() - started).toBeLessThan(1000)
  })
})
