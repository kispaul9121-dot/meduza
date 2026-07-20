import { CompatibilityData, ValidationMode } from "./types"
import { array, unique } from "./utils"
import { resolveCandidates } from "./candidate-resolver"
import { resolveProperties } from "./property-resolver"
import { resolveRelations } from "./relation-resolver"
import { selectedComponents } from "./facts"

function matchesValueType(value: unknown, type: string) {
  if (value === null || value === undefined) return true
  if (type === "number") return typeof value === "number" && Number.isFinite(value)
  if (type === "boolean") return typeof value === "boolean"
  if (["text", "enum", "reference"].includes(type)) return typeof value === "string"
  if (type === "list") return Array.isArray(value)
  if (type === "object") return typeof value === "object" && !Array.isArray(value)
  return true
}

export function validateReadiness(data: CompatibilityData, options: { mode?: ValidationMode; manifest?: any } = {}) {
  const mode = options.mode || data.mode || "guided_check"
  const definitions = new Map((data.property_definitions || []).map((definition: any) => [definition.id, definition]))
  const relationTypes = new Map((data.relation_type_definitions || []).map((definition: any) => [definition.id, definition]))
  const blockers: any[] = []
  const warnings: any[] = []
  const repair: any[] = []
  if (data.partial) blockers.push({ code: "PARTIAL_GRAPH_UNRESOLVED" })
  for (const assignment of data.property_assignments || []) {
    const definition = definitions.get(assignment.property_definition_id) as any
    if (!definition) {
      blockers.push({ code: "PROPERTY_DEFINITION_MISSING", assignment_id: assignment.id })
      repair.push({ action: "create_property_definition", assignment_id: assignment.id })
      continue
    }
    if (!array(definition.entity_scopes).includes(assignment.owner_type)) blockers.push({ code: "PROPERTY_SCOPE_NOT_ALLOWED", assignment_id: assignment.id, owner_type: assignment.owner_type })
    if (!matchesValueType(assignment.value_json, definition.value_type)) blockers.push({ code: "PROPERTY_VALUE_TYPE_INVALID", assignment_id: assignment.id, expected: definition.value_type })
    if (definition.unit && assignment.value_json?.unit && definition.unit !== assignment.value_json.unit) blockers.push({ code: "PROPERTY_UNIT_INVALID", assignment_id: assignment.id, expected: definition.unit })
    if (definition.affects_compatibility && !definition.validator_key && !definition.fact_path) {
      blockers.push({ code: "PROPERTY_VALIDATOR_MISSING", property: definition.key })
      repair.push({ action: "assign_validator", property: definition.key })
    }
  }
  const unmappedRelations = (data.relations || []).filter((relation: any) => (relationTypes.get(relation.relation_type_id) as any)?.status !== "engine_mapped")
  for (const relation of unmappedRelations) {
    blockers.push({ code: "RELATION_UNMAPPED", relation_id: relation.id })
    repair.push({ action: "map_relation_type", relation_id: relation.id })
  }
  const propertyResolution = resolveProperties(data)
  blockers.push(...propertyResolution.issues.map((issue) => ({ code: issue.code, path: issue.path })))
  const selected = selectedComponents(data)
  const relationResolution = resolveRelations(data, selected.components)
  blockers.push(...relationResolution.issues.map((issue) => ({ code: issue.code, component_id: issue.component_id })))
  const candidates = resolveCandidates(data)
  const manifest = options.manifest
  if (mode === "bulk_dry_run" && manifest) {
    const creates = array<any>(manifest.planned_creates_json)
    const identities = creates.map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)
    const duplicates = identities.filter((identity, index) => identities.indexOf(identity) !== index)
    for (const identity of unique(duplicates)) blockers.push({ code: "MANIFEST_DUPLICATE_IDENTITY", identity })
    const nodes = array<any>(manifest.dependency_nodes || manifest.planned_links_json)
    const ids = new Set(nodes.map((node) => node.id))
    for (const node of nodes) for (const dependency of array<string>(node.depends_on)) if (!ids.has(dependency)) blockers.push({ code: "MANIFEST_DEPENDENCY_MISSING", node_id: node.id, dependency })
    const graph = new Map(nodes.map((node) => [node.id, array<string>(node.depends_on)]))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const hasCycle = (id: string): boolean => {
      if (visiting.has(id)) return true
      if (visited.has(id)) return false
      visiting.add(id)
      if ((graph.get(id) || []).some(hasCycle)) return true
      visiting.delete(id)
      visited.add(id)
      return false
    }
    if ([...graph.keys()].some(hasCycle)) blockers.push({ code: "MANIFEST_DEPENDENCY_CYCLE" })
  }
  const referencedConceptIds = new Set((data.relations || []).flatMap((relation: any) => [relation.source_id, relation.target_id]))
  const unusedConcepts = (data.concepts || []).filter((concept: any) => !referencedConceptIds.has(concept.id)).map((concept: any) => concept.id)
  const resultBlockers = mode === "guided_check" ? blockers.slice(0, 1) : blockers
  return {
    mode,
    ready: blockers.length === 0,
    status: blockers.length ? "unresolved" : "ready",
    entity_readiness: { server_model: Boolean(data.model), properties: propertyResolution.issues.length === 0, relations: unmappedRelations.length === 0, validators: !blockers.some((item) => item.code.includes("VALIDATOR")) },
    resolved_properties: propertyResolution.properties,
    inherited_provenance: propertyResolution.properties.map((item) => ({ key: item.key, chain: item.inheritance_chain })),
    unresolved_properties: blockers.filter((item) => item.code.includes("PROPERTY")),
    unmapped_relations: unmappedRelations.map((item: any) => item.id),
    missing_definitions: blockers.filter((item) => item.code.includes("DEFINITION")),
    missing_values: blockers.filter((item) => item.code.includes("VALUE")),
    missing_concepts: blockers.filter((item) => item.code.includes("CONCEPT")),
    missing_relations: blockers.filter((item) => item.code.includes("RELATION") || item.code.includes("PROVIDER")),
    missing_validators: blockers.filter((item) => item.code.includes("VALIDATOR")),
    unresolved_conflicts: blockers.filter((item) => item.code.includes("CONFLICT")),
    missing_providers_consumers: blockers.filter((item) => item.code.includes("PROVIDER") || item.code.includes("CONSUMER")),
    unused_concepts: unusedConcepts,
    inherited_conflicts: propertyResolution.properties.filter((item) => item.conflict).map((item) => item.key),
    validator_gaps: blockers.filter((item) => item.code.includes("VALIDATOR")),
    affected_configuration_count: (data.configurations || []).length,
    candidate_packs: unique((data.pack_assignments || []).map((item: any) => item.component_pack_id)),
    candidate_count: candidates.options.length,
    blockers: resultBlockers,
    warnings,
    recommendations: repair,
    proposed_mappings: mode === "assisted_preview" ? repair.filter((item) => item.action === "assign_validator" || item.action === "map_relation_type") : [],
    predicted_effects: mode === "assisted_preview" ? { blockers_after_repair: Math.max(0, blockers.length - repair.length) } : undefined,
    idempotent: mode === "bulk_dry_run" ? unique(array<any>(manifest?.planned_creates_json).map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)).length === array(manifest?.planned_creates_json).length : true,
    partial: Boolean(data.partial),
    compatible: false,
    recommended_next_actions: repair,
  }
}
