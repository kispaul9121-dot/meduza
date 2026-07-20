import { resolveProperties } from "./engine/property-resolver"
import {
  buildCatalogRecord,
  CatalogFilterDefinition,
  CatalogRecord,
  normalizePropertyValue,
  propertyCatalogDefinitions,
  SYSTEM_CATALOG_FILTERS,
  validateCatalogPropertyIndex,
} from "./catalog-query"

type CatalogLoadResult = {
  records: CatalogRecord[]
  definitions: CatalogFilterDefinition[]
  index_validation: ReturnType<typeof validateCatalogPropertyIndex>
  duration_ms: number
  query_count: number
}

function scopeChain(model: any) {
  return [
    { type: "global", id: "global" },
    model.technology_platform_id && {
      type: "technology_platform",
      id: model.technology_platform_id,
    },
    model.vendor_generation_template_id && {
      type: "vendor_generation",
      id: model.vendor_generation_template_id,
    },
    model.server_family_id && {
      type: "server_family",
      id: model.server_family_id,
    },
    { type: "server_model", id: model.id },
  ].filter(Boolean) as Array<{ type: string; id: string }>
}

function minimumPrice(product: any) {
  const amounts = (product?.variants || [])
    .flatMap((variant: any) => variant?.prices || variant?.price_set?.prices || [])
    .filter((price: any) => String(price.currency_code || "").toLowerCase() === "usd")
    .map((price: any) => Number(price.amount))
    .filter(Number.isFinite)
  return amounts.length ? Math.min(...amounts) : null
}

function inventoryAvailability(product: any) {
  const variants = product?.variants || []
  if (!variants.length) return null
  if (variants.some((variant: any) => variant.manage_inventory === false)) return "available"
  const available = variants.reduce((sum: number, variant: any) => {
    if (Number.isFinite(Number(variant.inventory_quantity))) {
      return sum + Number(variant.inventory_quantity)
    }
    const levels = (variant.inventory_items || []).flatMap(
      (item: any) => item?.inventory?.location_levels || item?.location_levels || [],
    )
    return sum + levels.reduce(
      (total: number, level: any) =>
        total + Number(level.available_quantity ?? Number(level.stocked_quantity || 0) - Number(level.reserved_quantity || 0)),
      0,
    )
  }, 0)
  if (available > 0) return "in_stock"
  if (variants.some((variant: any) => variant.allow_backorder)) return "backorder"
  return "out_of_stock"
}

function realCategories(product: any) {
  return (product?.categories || [])
    .map((category: any) => category.handle || category.name)
    .filter(Boolean)
}

function commerce(product: any) {
  if (!product) return {}
  return {
    categories: realCategories(product),
    price: minimumPrice(product),
    availability: inventoryAvailability(product),
    condition:
      typeof product.metadata?.condition === "string"
        ? product.metadata.condition
        : null,
  }
}

function effectiveDefinitions(definitions: CatalogFilterDefinition[], records: CatalogRecord[]) {
  return definitions.filter((definition) => {
    if (definition.source !== "commerce") return true
    return records.some((record) => {
      const value = record.values[definition.key]
      return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== ""
    })
  })
}

function normalizePresentationValue(value: unknown, definition: any, concepts: Map<any, any>): unknown {
  const normalized = normalizePropertyValue(value, definition)
  if (Array.isArray(normalized)) {
    return normalized.map((item) => normalizePresentationValue(item, definition, concepts))
  }
  if (["reference", "enum"].includes(definition.value_type)) {
    const concept = concepts.get(String(normalized))
    return concept?.display_name || normalized
  }
  return normalized
}

export async function loadServerCatalog(
  service: any,
  graph: { graph(input: Record<string, unknown>): Promise<{ data: any[] }> },
): Promise<CatalogLoadResult> {
  const started = performance.now()
  let queryCount = 0
  const counted = async (promise: Promise<any>): Promise<any> => {
    queryCount += 1
    return promise
  }
  const [models, definitions, concepts, aliases] = await Promise.all([
    counted(service.listServerModels({ enabled: true }, { take: 10000, order: { public_name: "ASC" } })),
    counted(service.listPropertyDefinitions({}, { take: 10000 })),
    counted(service.listTechnologyConcepts({}, { take: 10000 })),
    counted(service.listConceptAliases({}, { take: 10000 })),
  ])
  const publicDefinitions = definitions.filter(
    (definition: any) =>
      (definition.filterable === true || definition.displayable === true || definition.comparable === true) &&
      definition.lifecycle_status === "active" &&
      definition.usage_status !== "deprecated",
  )
  const definitionIds = new Set(publicDefinitions.map((definition: any) => definition.id))
  const definitionByKey = new Map(publicDefinitions.map((definition: any) => [definition.key, definition]))
  const conceptById = new Map(concepts.map((concept: any) => [concept.id, concept]))
  const scopeIds = Array.from(new Set([
    "global",
    ...models.flatMap((model: any) => scopeChain(model).map((scope) => scope.id)),
  ]))
  const productIds = models.map((model: any) => model.medusa_product_id).filter(Boolean)
  const [allAssignments, productResult] = await Promise.all([
    counted(
      scopeIds.length
        ? service.listPropertyAssignments(
            { owner_id: scopeIds, enabled: true },
            { take: 100000 },
          )
        : Promise.resolve([]),
    ),
    counted(
      productIds.length
        ? graph.graph({
            entity: "product",
            fields: [
              "id",
              "status",
              "metadata",
              "categories.id",
              "categories.handle",
              "categories.name",
              "variants.id",
              "variants.manage_inventory",
              "variants.allow_backorder",
              "variants.inventory_quantity",
              "variants.prices.amount",
              "variants.prices.currency_code",
              "variants.inventory_items.inventory.location_levels.available_quantity",
              "variants.inventory_items.inventory.location_levels.stocked_quantity",
              "variants.inventory_items.inventory.location_levels.reserved_quantity",
            ],
            filters: { id: productIds },
            pagination: { take: Math.max(productIds.length, 1) },
          })
        : Promise.resolve({ data: [] }),
    ),
  ])
  const assignments = allAssignments.filter((assignment: any) =>
    definitionIds.has(assignment.property_definition_id),
  )
  const products = new Map(
    (productResult.data || [])
      .filter((product: any) => product.status === "published")
      .map((product: any) => [product.id, product]),
  )
  const records = models
    .filter((model: any) => model.medusa_product_id && products.has(model.medusa_product_id))
    .map((model: any) => {
      const resolution = resolveProperties({
        property_definitions: publicDefinitions,
        property_assignments: assignments,
        scope_chain: scopeChain(model),
      } as any)
      const record = buildCatalogRecord({
        model,
        effective_properties: resolution.properties
          .filter((property) => !property.excluded && !property.conflict)
          .map((property) => ({
            ...property,
            definition: definitionByKey.get(property.key),
          })),
        commerce: commerce(products.get(model.medusa_product_id)),
      })
      record.model.presentation_properties = resolution.properties
        .map((property) => {
          const definition: any = definitionByKey.get(property.key)
          if (!definition || (!definition.displayable && !definition.comparable)) return null
          const normalized = normalizePresentationValue(property.value, definition, conceptById)
          return {
            key: definition.key,
            label: definition.label,
            value_type: definition.value_type,
            value: property.excluded || property.conflict ? null : normalized,
            unit: definition.unit || null,
            comparable: definition.comparable === true,
            state: property.excluded
              ? "not_applicable"
              : property.conflict || normalized === undefined || normalized === null
                ? "not_specified"
                : definition.value_type === "boolean" && normalized === false
                  ? "not_supported"
                  : "value",
            compatibility_status: definition.usage_status === "engine_mapped"
              ? "engine_mapped"
              : "informational",
            inherited: property.source_scope !== "server_model",
          }
        })
        .filter(Boolean)
      return record
    })
  const catalogDefinitions = effectiveDefinitions(
    [
      ...SYSTEM_CATALOG_FILTERS,
      ...propertyCatalogDefinitions(publicDefinitions, concepts, aliases),
    ],
    records,
  )
  return {
    records,
    definitions: catalogDefinitions,
    index_validation: validateCatalogPropertyIndex(definitions, allAssignments),
    duration_ms: performance.now() - started,
    query_count: queryCount,
  }
}
