import { createHash } from "node:crypto"
import { normalizePropertyValue, propertyCatalogDefinitions } from "./catalog-query"

export const COMPONENT_CATEGORIES = [
  { key: "cpu", label: "Процессоры", types: ["cpu"] },
  { key: "memory", label: "Память", types: ["ram"], aliases: ["ram"] },
  { key: "drives", label: "Накопители", types: ["drive"], aliases: ["drive"] },
  { key: "raid-hba", label: "RAID / HBA", types: ["raid"], aliases: ["raid", "hba"] },
  { key: "network", label: "Сетевые адаптеры", types: ["nic"], aliases: ["nic"] },
  { key: "accelerators", label: "GPU / ускорители", types: ["accelerator"], aliases: ["gpu", "accelerator"] },
  { key: "psu", label: "Блоки питания", types: ["psu"] },
  { key: "risers", label: "Райзеры", types: ["riser"], aliases: ["riser"] },
  { key: "boot-storage", label: "Загрузочные накопители", types: ["boot_storage"], aliases: ["boot_storage"] },
  { key: "accessories", label: "Аксессуары", types: ["rails", "cable", "cooling", "license", "service"] },
  { key: "storage", label: "Storage infrastructure", types: ["drive", "backplane", "drive_cage", "cable"] },
  { key: "media-bay", label: "Media Bay", types: ["backplane"], predicate: "media_bay" },
] as const

export type ComponentAttribute = {
  key: string
  label: string
  value_type: string
  value: unknown
  unit: string | null
  comparable: boolean
  compatibility_status: "engine_mapped" | "informational"
  value_source: "property_value" | "property_assignment" | "normalized_specs"
}

export type ComponentCatalogItem = {
  id: string
  type: string
  category_keys: string[]
  brand: string
  model: string
  public_name: string
  short_name: string
  part_number: string | null
  normalization_status: string
  attributes: ComponentAttribute[]
  capabilities: { provides: unknown; consumes: unknown; requirements: unknown }
  product_identity: {
    technical_component_id: string
    medusa_variant_id: string | null
    sellable: boolean
    medusa_product_id: string | null
    medusa_product_handle: string | null
  }
  commerce: { price: number | null; currency_code: string | null; availability: string }
}

export type ComponentFilterDefinition = ReturnType<typeof propertyCatalogDefinitions>[number]

const legacyPaths: Record<string, string[]> = {
  "cpu.base_frequency": ["base_frequency_ghz", "base_clock"],
  "cpu.cache": ["cache_mb", "cache"],
  "cpu.cores": ["cores"],
  "cpu.max_memory_speed": ["max_memory_speed_mhz", "max_memory_speed"],
  "cpu.max_socket_count": ["max_socket_count", "scalability"],
  "cpu.memory_channels": ["memory_channels"],
  "cpu.pcie_generation": ["pcie_generation", "pcie_revision"],
  "cpu.socket": ["socket"],
  "cpu.tdp": ["tdp_w", "tdp"],
  "cpu.threads": ["threads"],
  "cpu.turbo_frequency": ["max_turbo_frequency_ghz", "max_clock"],
  "cpu.upi_links": ["upi_links"],
  "storage.form_factor": ["form_factor"],
  "storage.protocol": ["interface", "interfaces"],
  "accelerator.subtype": ["subtype", "accelerator_type", "product_type"],
}

function readPath(source: any, path: string) {
  return path.split(".").reduce((value, key) => value?.[key], source)
}

function compactNumber(value: unknown) {
  if (typeof value !== "string") return value
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[a-z/]+$/i)
  return match ? Number(match[1]) : value
}

export function normalizedComponentValue(component: any, definition: any) {
  const source = component.normalized_specs_json || {}
  const candidates = [
    definition.fact_path,
    definition.key,
    definition.key.split(".").at(-1),
    ...(legacyPaths[definition.key] || []),
  ].filter(Boolean)
  for (const path of candidates) {
    const value = readPath(source, path)
    if (value !== undefined && value !== null && value !== "") {
      return normalizePropertyValue(compactNumber(value), definition)
    }
  }
  return undefined
}

export function resolveComponentCategory(value: string) {
  const normalized = String(value || "").toLocaleLowerCase()
  return COMPONENT_CATEGORIES.find((category) =>
    category.key === normalized || ("aliases" in category && category.aliases?.includes(normalized as never)),
  )
}

export function componentCategoryKeys(component: any) {
  return COMPONENT_CATEGORIES
    .filter((category) => category.types.includes(component.type as never))
    .filter((category) => !("predicate" in category) || category.predicate !== "media_bay" || component.normalized_specs_json?.media_bay === true)
    .map((category) => category.key)
}

export function componentSchemaVersion(definitions: any[]) {
  return `components-${createHash("sha256").update(JSON.stringify(definitions.map((definition) => ({
    key: definition.key,
    schema_version: definition.schema_version,
    value_type: definition.value_type,
  })))).digest("hex").slice(0, 12)}`
}

export function componentMatches(item: ComponentCatalogItem, input: {
  category?: string
  q?: string
  brand?: string[]
  attributes?: Record<string, string[]>
  ranges?: Record<string, { min?: number; max?: number }>
  texts?: Record<string, string>
  excluded?: string
}) {
  if (input.category) {
    const category = resolveComponentCategory(input.category)
    if (!category || !item.category_keys.includes(category.key)) return false
  }
  const q = String(input.q || "").trim().toLocaleLowerCase()
  if (q && ![item.public_name, item.short_name, item.brand, item.model, item.part_number]
    .some((value) => String(value || "").toLocaleLowerCase().includes(q))) return false
  if (input.excluded !== "brand" && input.brand?.length && !input.brand.some((brand) => brand.toLocaleLowerCase() === item.brand.toLocaleLowerCase())) return false
  for (const [key, selected] of Object.entries(input.attributes || {})) {
    if (input.excluded === key || !selected.length) continue
    const property = item.attributes.find((attribute) => `attr.${attribute.key}` === key)
    const values = Array.isArray(property?.value) ? property.value : [property?.value]
    if (!selected.some((selection) => values.some((value) => String(value).toLocaleLowerCase() === selection.toLocaleLowerCase()))) return false
  }
  for (const [key, range] of Object.entries(input.ranges || {})) {
    if (input.excluded === key) continue
    const property = item.attributes.find((attribute) => `attr.${attribute.key}` === key)
    const value = Number(property?.value)
    if (!Number.isFinite(value) || (range.min !== undefined && value < range.min) || (range.max !== undefined && value > range.max)) return false
  }
  for (const [key, text] of Object.entries(input.texts || {})) {
    if (input.excluded === key) continue
    const property = item.attributes.find((attribute) => `attr.${attribute.key}` === key)
    if (!String(property?.value || "").toLocaleLowerCase().includes(text.toLocaleLowerCase())) return false
  }
  return true
}

export function executeComponentCatalog(input: {
  items: ComponentCatalogItem[]
  definitions: any[]
  category?: string
  q?: string
  brand?: string[]
  attributes?: Record<string, string[]>
  ranges?: Record<string, { min?: number; max?: number }>
  texts?: Record<string, string>
  page: number
  limit: number
  sort: "name_asc" | "name_desc" | "brand_asc"
  duration_ms: number
  query_count: number
}) {
  const filters = { category: input.category, q: input.q, brand: input.brand, attributes: input.attributes, ranges: input.ranges, texts: input.texts }
  const filtered = input.items.filter((item) => componentMatches(item, filters))
  const sorted = [...filtered].sort((left, right) => {
    const tie = left.id.localeCompare(right.id)
    if (input.sort === "name_desc") return right.public_name.localeCompare(left.public_name) || tie
    if (input.sort === "brand_asc") return left.brand.localeCompare(right.brand) || left.public_name.localeCompare(right.public_name) || tie
    return left.public_name.localeCompare(right.public_name) || tie
  })
  const offset = (input.page - 1) * input.limit
  const facetDefinitions = propertyCatalogDefinitions(input.definitions)
  const facets: any[] = []
  const brandCandidates = input.items.filter((item) => componentMatches(item, { ...filters, excluded: "brand" }))
  const brandCounts = new Map<string, number>()
  for (const item of brandCandidates) brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1)
  facets.push({ key: "brand", type: "multi_select", values: [...brandCounts].map(([value, count]) => ({ value, label: value, count })).sort((a, b) => a.label.localeCompare(b.label)) })
  for (const definition of facetDefinitions) {
    const candidates = input.items.filter((item) => componentMatches(item, { ...filters, excluded: definition.key }))
    if (definition.type === "range") {
      const values = candidates.map((item) => Number(item.attributes.find((attribute) => `attr.${attribute.key}` === definition.key)?.value)).filter(Number.isFinite)
      if (values.length) facets.push({ key: definition.key, type: definition.type, values: [], range: { min: Math.min(...values), max: Math.max(...values), count: values.length, unit: definition.unit || null } })
      continue
    }
    if (definition.type === "text") continue
    const counts = new Map<string, number>()
    for (const item of candidates) {
      const property = item.attributes.find((attribute) => `attr.${attribute.key}` === definition.key)
      const values = Array.isArray(property?.value) ? property.value : [property?.value]
      for (const value of new Set(values.filter((entry) => entry !== undefined && entry !== null).map(String))) counts.set(value, (counts.get(value) || 0) + 1)
    }
    if (counts.size) facets.push({ key: definition.key, type: definition.type, values: [...counts].map(([value, count]) => ({ value, label: value, count })).sort((a, b) => a.label.localeCompare(b.label)) })
  }
  return {
    items: sorted.slice(offset, offset + input.limit),
    total: filtered.length,
    pagination: { page: input.page, limit: input.limit, pages: Math.ceil(filtered.length / input.limit), has_previous: input.page > 1, has_next: offset + input.limit < filtered.length },
    categories: COMPONENT_CATEGORIES.map(({ key, label }) => ({ key, label, count: input.items.filter((item) => item.category_keys.includes(key)).length })),
    facets,
    filter_schema: {
      version: componentSchemaVersion(input.definitions),
      definitions: [
        { key: "brand", label: "Бренд", category: "Компонент", type: "multi_select", source: "component", schema_version: 1, primary: true },
        ...facetDefinitions,
      ],
    },
    active_filters: { category: input.category || null, q: input.q || "", brand: input.brand || [], ...(input.attributes || {}), ...(input.ranges || {}), ...(input.texts || {}) },
    applied_sort: input.sort,
    query_metadata: { duration_ms: Number(input.duration_ms.toFixed(3)), query_count: input.query_count, scanned_count: input.items.length, deterministic_tiebreaker: "component.id" },
  }
}
