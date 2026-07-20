import {
  componentCategoryKeys,
  ComponentAttribute,
  ComponentCatalogItem,
  normalizedComponentValue,
} from "./component-catalog"
import { normalizePropertyValue } from "./catalog-query"

function conceptValue(value: unknown, concepts: Map<string, any>): unknown {
  if (Array.isArray(value)) return value.map((item) => conceptValue(item, concepts))
  return concepts.get(String(value))?.display_name || value
}

function publicDefinition(definition: any) {
  return definition.lifecycle_status === "active" &&
    definition.usage_status !== "deprecated" &&
    Array.isArray(definition.entity_scopes) &&
    definition.entity_scopes.includes("component") &&
    (definition.displayable || definition.filterable || definition.comparable)
}

export async function loadComponentCatalog(service: any) {
  const started = performance.now()
  let queryCount = 0
  const counted = async (promise: Promise<any>) => {
    queryCount += 1
    return promise
  }
  const [components, allDefinitions, propertyValues, assignments, concepts, aliases] = await Promise.all([
    counted(service.listComponents({ enabled: true }, { take: 100000, order: { public_name: "ASC" } })),
    counted(service.listPropertyDefinitions({}, { take: 10000 })),
    counted(service.listPropertyValues({ owner_entity_type: "component" }, { take: 100000 })),
    counted(service.listPropertyAssignments({ owner_type: "component", enabled: true }, { take: 100000 })),
    counted(service.listTechnologyConcepts({}, { take: 10000 })),
    counted(service.listConceptAliases({}, { take: 10000 })),
  ])
  const definitions = allDefinitions.filter(publicDefinition)
  const conceptById = new Map<string, any>(concepts.map((concept: any) => [concept.id, concept]))
  const valuesByOwner = new Map<string, any[]>()
  for (const value of propertyValues.filter((entry: any) => entry.review_status === "verified")) {
    const bucket = valuesByOwner.get(value.owner_entity_id) || []
    bucket.push(value)
    valuesByOwner.set(value.owner_entity_id, bucket)
  }
  const assignmentsByOwner = new Map<string, any[]>()
  for (const assignment of assignments.filter((entry: any) => entry.assignment_mode !== "disable" && entry.assignment_mode !== "unresolved_draft")) {
    const bucket = assignmentsByOwner.get(assignment.owner_id) || []
    bucket.push(assignment)
    assignmentsByOwner.set(assignment.owner_id, bucket)
  }
  const items: ComponentCatalogItem[] = components.map((component: any) => {
    const verified = new Map((valuesByOwner.get(component.id) || []).map((value: any) => [value.property_definition_id, value]))
    const direct = new Map((assignmentsByOwner.get(component.id) || []).sort((a: any, b: any) => String(a.id).localeCompare(String(b.id))).map((assignment: any) => [assignment.property_definition_id, assignment]))
    const attributes = definitions.map((definition: any): ComponentAttribute | null => {
      const propertyValue: any = verified.get(definition.id)
      const assignment: any = direct.get(definition.id)
      const source = propertyValue ? "property_value" : assignment ? "property_assignment" : "normalized_specs"
      const raw = propertyValue
        ? propertyValue.normalized_value_json
        : assignment
          ? assignment.value_json
          : normalizedComponentValue(component, definition)
      if (raw === undefined || raw === null || raw === "") return null
      const value = conceptValue(normalizePropertyValue(raw, definition), conceptById)
      return {
        key: definition.key,
        label: definition.label,
        value_type: definition.value_type,
        value,
        unit: definition.unit || null,
        comparable: definition.comparable === true,
        compatibility_status: definition.usage_status === "engine_mapped" ? "engine_mapped" : "informational",
        value_source: source,
      }
    }).filter(Boolean) as ComponentAttribute[]
    const normalized = component.normalized_specs_json || {}
    const linked = Boolean(component.medusa_product_variant_id)
    return {
      id: component.id,
      type: component.type,
      category_keys: componentCategoryKeys(component),
      brand: component.brand,
      model: component.model,
      public_name: component.public_name,
      short_name: component.short_name,
      part_number: component.part_number || null,
      normalization_status: component.normalization_status,
      attributes,
      capabilities: {
        provides: component.provides_json ?? normalized.provides ?? null,
        consumes: component.consumes_json ?? normalized.consumes ?? null,
        requirements: component.requirements_json ?? normalized.requires ?? null,
      },
      product_identity: {
        technical_component_id: component.id,
        medusa_variant_id: component.medusa_product_variant_id || null,
        sellable: linked,
        medusa_product_id: null,
        medusa_product_handle: null,
      },
      commerce: {
        price: null,
        currency_code: null,
        availability: linked ? "commerce_record_linked" : "not_for_individual_sale",
      },
    }
  })
  const definitionsWithConcepts = definitions.map((definition: any) => {
    const source = Array.isArray(definition.allowed_values_json)
      ? definition.allowed_values_json
      : definition.allowed_values_json?.values || []
    return {
      ...definition,
      allowed_values_json: source.map((entry: any) => {
        const value = String(typeof entry === "object" ? entry.value ?? entry.key : entry)
        return {
          value,
          label: conceptById.get(value)?.display_name || (typeof entry === "object" ? entry.label : value),
          aliases: aliases.filter((alias: any) => alias.technology_concept_id === value).map((alias: any) => alias.alias),
        }
      }),
    }
  })
  return {
    items,
    definitions: definitionsWithConcepts,
    duration_ms: performance.now() - started,
    query_count: queryCount,
  }
}
