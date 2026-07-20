import { createHash } from "node:crypto"
import { CompatibilityData, CompatibilityResult, SelectedComponentInput } from "./engine"

export const READY_CONFIGURATION_ENGINE_VERSION = "adr-011-engine-v1"

export type ReadyPriceMode = "fixed" | "from" | "request_quote"

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)])
    )
  }
  return value
}

export function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")
}

function versionedRows(rows: any[] = [], keys: string[]) {
  return rows
    .map((row) => Object.fromEntries(keys.map((key) => [key, row?.[key] ?? null])))
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
}

export function readyDependencyFingerprints(data: CompatibilityData) {
  const properties = versionedRows(data.property_definitions, [
    "id", "key", "schema_version", "lifecycle_status", "usage_status", "validator_key",
  ])
  const propertyAssignments = versionedRows(data.property_assignments, [
    "id", "owner_type", "owner_id", "property_definition_id", "assignment_mode", "value_json", "enabled",
  ])
  const relations = versionedRows(data.relations, [
    "id", "source_type", "source_id", "relation_type_id", "target_type", "target_id", "quantity", "conditions_json", "enabled", "schema_version",
  ])
  const concepts = versionedRows(data.concepts, ["id", "stable_key", "concept_type_id", "schema_version", "lifecycle_status"])
  const packs = versionedRows(data.packs, ["id", "schema_version", "enabled", "pack_kind"])
  const packItems = versionedRows(data.pack_items, ["id", "component_pack_id", "component_id", "enabled", "sort_order"])
  const packAssignments = versionedRows(data.pack_assignments, [
    "id", "scope_type", "scope_id", "component_pack_id", "enabled", "priority", "inheritance_behavior", "overrides_json", "exclusions_json",
  ])
  const components = versionedRows(data.components, [
    "id", "schema_version", "enabled", "normalization_status", "normalized_specs_json", "requirements_json", "provides_json", "consumes_json", "medusa_product_variant_id", "price", "stock_qty",
  ])
  const relation_graph_hash = stableHash({ relations, concepts })
  const property_schema_hash = stableHash({ properties, propertyAssignments })
  const pack_assignment_hash = stableHash({ packs, packItems, packAssignments })
  return {
    relation_graph_hash,
    property_schema_hash,
    pack_assignment_hash,
    dependency_hash: stableHash({ relation_graph_hash, property_schema_hash, pack_assignment_hash, components }),
  }
}

export function pricePublicationErrors(input: {
  price_mode: ReadyPriceMode
  currency_code?: string | null
  base_price?: number | null
  components_price?: number | null
  total_price?: number | null
  model?: any
  selected_components?: any[]
}) {
  if (input.price_mode === "request_quote") return []
  const errors: string[] = []
  if (!input.currency_code) errors.push("PRICE_CURRENCY_REQUIRED")
  if (!input.model?.medusa_variant_id) errors.push("BASE_VARIANT_REQUIRED")
  if (input.total_price == null || !Number.isFinite(Number(input.total_price))) errors.push("TOTAL_PRICE_REQUIRED")
  const missingCommerce = (input.selected_components || [])
    .filter((item) => !item.medusa_product_variant_id)
    .map((item) => item.component_id)
  if (missingCommerce.length) errors.push(`COMPONENT_COMMERCE_LINK_REQUIRED:${missingCommerce.join(",")}`)
  return errors
}

export function buildReadyConfigurationSnapshot(input: {
  data: CompatibilityData
  validation: CompatibilityResult
  selected_components: SelectedComponentInput[]
  explicit_none?: string[]
  storage_option_id?: string | null
  price_mode: ReadyPriceMode
  currency_code?: string | null
  base_price?: number | null
  components_price?: number | null
  total_price?: number | null
}) {
  const fingerprints = readyDependencyFingerprints(input.data)
  const selected = input.selected_components.map((selection) => {
    const component = input.data.components.find((item: any) => item.id === selection.component_id)
    return {
      component_id: selection.component_id,
      quantity: selection.quantity || 1,
      group_key: selection.group_key || null,
      zone_id: selection.zone_id || null,
      type: component?.type || null,
      public_name: component?.public_name || null,
      part_number: component?.part_number || null,
      schema_version: component?.schema_version || 1,
      normalized_specs: component?.normalized_specs_json || component?.specs_json || {},
      medusa_product_variant_id: component?.medusa_product_variant_id || null,
      unit_price: component?.price ?? null,
      available_at_snapshot: component ? component.enabled !== false && Number(component.stock_qty || 0) > 0 : false,
    }
  })
  const snapshot = canonical({
    snapshot_schema_version: 1,
    engine_version: READY_CONFIGURATION_ENGINE_VERSION,
    server_model: {
      id: input.data.model?.id,
      slug: input.data.model?.slug,
      public_name: input.data.model?.public_name,
      schema_version: input.data.model?.schema_version || 1,
      medusa_product_id: input.data.model?.medusa_product_id || null,
      medusa_variant_id: input.data.model?.medusa_variant_id || null,
    },
    topology: { storage_option_id: input.storage_option_id || null, placements: input.validation.placements },
    selected_components: selected,
    explicit_none: input.explicit_none || [],
    auto_added_components: input.validation.auto_added_components,
    effective_specs: input.validation.effective_specs,
    effective_properties: input.validation.resolved_properties,
    concept_ids: Array.from(new Set((input.data.concepts || []).map((item: any) => item.id))).sort(),
    pack_provenance: {
      assignments: versionedRows(input.data.pack_assignments, ["id", "scope_type", "scope_id", "component_pack_id", "priority", "inheritance_behavior"]),
      packs: versionedRows(input.data.packs, ["id", "slug", "schema_version", "pack_kind"]),
    },
    validation: {
      status: input.validation.status,
      reason_codes: input.validation.reason_codes,
      trace: input.validation.trace,
      warnings: input.validation.warnings,
      errors: input.validation.errors,
    },
    commerce: {
      price_mode: input.price_mode,
      currency_code: input.currency_code || null,
      base_price: input.base_price ?? null,
      components_price: input.components_price ?? null,
      total_price: input.total_price ?? null,
    },
    dependency_fingerprints: fingerprints,
  }) as any
  return { snapshot, snapshot_hash: stableHash(snapshot), ...fingerprints }
}

export function staleReasons(saved: any, current: ReturnType<typeof readyDependencyFingerprints>) {
  const reasons: string[] = []
  if (saved?.property_schema_hash !== current.property_schema_hash) reasons.push("PROPERTY_SCHEMA_CHANGED")
  if (saved?.relation_graph_hash !== current.relation_graph_hash) reasons.push("RELATION_GRAPH_CHANGED")
  if (saved?.pack_assignment_hash !== current.pack_assignment_hash) reasons.push("PACK_ASSIGNMENT_CHANGED")
  if (saved?.dependency_hash !== current.dependency_hash && !reasons.length) reasons.push("COMPONENT_OR_MODEL_CHANGED")
  return reasons
}
