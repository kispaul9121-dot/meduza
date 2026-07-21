import { CompatibilityData, ValidationMode } from "./types"
import { array, unique } from "./utils"
import { resolveCandidates } from "./candidate-resolver"
import { resolveProperties } from "./property-resolver"
import { resolveRelations } from "./relation-resolver"
import { selectedComponents } from "./facts"

type Severity = "blocking_error" | "warning" | "optional_improvement" | "complete"

type Finding = {
  code: string
  severity: Severity
  affected_entity: { type: string; id: string; label?: string }
  explanation: string
  repair_action: { action: string; label: string; target?: Record<string, unknown> }
  deep_link: string
  revalidation_required: boolean
  property?: string
  concept?: string
  relation?: string
  inherited_source?: { type: string; id: string } | null
  step?: number
  path?: string
  component_id?: string
  assignment_id?: string
  relation_id?: string
  expected?: unknown
}

type FindingInput = Omit<
  Finding,
  "severity" | "affected_entity" | "deep_link" | "revalidation_required"
> & {
  affected_entity?: Finding["affected_entity"]
  deep_link?: string
  revalidation_required?: boolean
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0
  }
  return value !== null && value !== undefined && value !== ""
}

function matchesValueType(value: unknown, type: string) {
  if (value === null || value === undefined) return true
  if (type === "number") return typeof value === "number" && Number.isFinite(value)
  if (type === "boolean") return typeof value === "boolean"
  if (["text", "enum", "reference"].includes(type)) return typeof value === "string"
  if (type === "list") return Array.isArray(value)
  if (type === "object") return typeof value === "object" && !Array.isArray(value)
  return true
}

function collectStrings(value: unknown, result = new Set<string>()) {
  if (typeof value === "string" && value) result.add(value)
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, result))
  else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, result))
  }
  return result
}

function link(data: CompatibilityData, path: string, step?: number) {
  const params = new URLSearchParams()
  if (data.model?.id) params.set("server_model_id", String(data.model.id))
  if (step) params.set("step", String(step))
  params.set("mode", "guided_manual")
  return `${path}?${params.toString()}`
}

function makeFinding(data: CompatibilityData, severity: Severity, item: FindingInput): Finding {
  return {
    ...item,
    severity,
    affected_entity: item.affected_entity || {
      type: "server_model",
      id: String(data.model?.id || "unresolved"),
      label: data.model?.public_name || data.model?.slug || "Unresolved server model",
    },
    deep_link: item.deep_link || link(data, "/server-configurator/server-wizard", item.step),
    revalidation_required: item.revalidation_required ?? severity !== "optional_improvement",
  }
}

export function validateReadiness(
  data: CompatibilityData,
  options: { mode?: ValidationMode; manifest?: any } = {},
) {
  const mode = options.mode || data.mode || "guided_check"
  const production = mode === "production_validation"
  const blockers: Finding[] = []
  const warnings: Finding[] = []
  const improvements: Finding[] = []
  const recommendations: Array<{ action: string; [key: string]: unknown }> = []
  const block = (item: FindingInput) => blockers.push(makeFinding(data, "blocking_error", item))
  const warn = (item: FindingInput) => warnings.push(makeFinding(data, "warning", item))
  const improve = (item: FindingInput) => improvements.push(makeFinding(data, "optional_improvement", { ...item, revalidation_required: false }))
  const recommend = (action: string, details: Record<string, unknown> = {}) => recommendations.push({ action, ...details })

  const definitions = new Map((data.property_definitions || []).map((item: any) => [item.id, item]))
  const relationTypes = new Map((data.relation_type_definitions || []).map((item: any) => [item.id, item]))
  const components = new Map((data.components || []).map((item: any) => [item.id, item]))
  const componentTypes = new Map((data.component_type_definitions || []).map((item: any) => [item.key, item]))

  if (data.partial) block({
    code: "PARTIAL_GRAPH_UNRESOLVED",
    explanation: "The compatibility graph is partial and cannot be published deterministically.",
    repair_action: { action: "complete_graph", label: "Complete the graph in Guided Manual mode" },
    step: 12,
  })
  if (!data.model) block({
    code: "SERVER_MODEL_MISSING",
    explanation: "The selected server model is missing or inaccessible.",
    repair_action: { action: "select_server_model", label: "Select an existing server model" },
    deep_link: "/server-configurator/models",
  })

  for (const assignment of data.property_assignments || []) {
    const definition: any = definitions.get(assignment.property_definition_id)
    if (!definition) {
      block({
        code: "PROPERTY_DEFINITION_MISSING",
        assignment_id: assignment.id,
        explanation: "A property assignment points to a missing canonical definition.",
        repair_action: { action: "create_property_definition", label: "Create or relink the property definition", target: { assignment_id: assignment.id } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
      })
      recommend("create_property_definition", { assignment_id: assignment.id })
      continue
    }
    const inherited = assignment.inherited_from_id
      ? { type: assignment.inherited_from_type || "unknown", id: assignment.inherited_from_id }
      : null
    if (!array(definition.entity_scopes).includes(assignment.owner_type)) block({
      code: "PROPERTY_SCOPE_NOT_ALLOWED",
      property: definition.key,
      assignment_id: assignment.id,
      inherited_source: inherited,
      explanation: `Property ${definition.key} is assigned to unsupported scope ${assignment.owner_type}.`,
      repair_action: { action: "move_property_assignment", label: "Move the value to an allowed scope", target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
    if (!matchesValueType(assignment.value_json, definition.value_type)) block({
      code: "PROPERTY_VALUE_TYPE_INVALID",
      property: definition.key,
      assignment_id: assignment.id,
      inherited_source: inherited,
      expected: definition.value_type,
      explanation: `Property ${definition.key} does not match value type ${definition.value_type}.`,
      repair_action: { action: "normalize_property_value", label: "Normalize the property value", target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
    if (definition.affects_compatibility && !definition.validator_key && !definition.fact_path) {
      block({
        code: "PROPERTY_VALIDATOR_MISSING",
        property: definition.key,
        inherited_source: inherited,
        explanation: `Compatibility property ${definition.key} is not mapped to an engine fact or validator.`,
        repair_action: { action: "assign_validator", label: "Map the property to a fact or validator", target: { property: definition.key } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
      })
      recommend("assign_validator", { property: definition.key })
    }
    if (production && definition.lifecycle_status === "deprecated") warn({
      code: "DEPRECATED_PROPERTY_IN_USE",
      property: definition.key,
      inherited_source: inherited,
      explanation: `Deprecated property ${definition.key} is still used by this model.`,
      repair_action: { action: "replace_deprecated_property", label: "Replace the deprecated property", target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
  }

  const propertyResolution = resolveProperties(data)
  propertyResolution.issues.forEach((issue) => block({
    code: issue.code,
    path: issue.path,
    explanation: `Property resolution failed at ${issue.path || "an unresolved path"}.`,
    repair_action: { action: "resolve_property_conflict", label: "Review inherited and direct values", target: { path: issue.path } },
    deep_link: "/server-configurator/knowledge-base?entity=property_definition",
  }))

  if (production) {
    const resolved = new Map(propertyResolution.properties.filter((item: any) => !item.excluded).map((item: any) => [item.key, item.value]))
    const activeScopes = new Set((data.scope_chain || []).map((scope) => scope.type))
    for (const definition of data.property_definitions || []) {
      if (!definition.required || !array(definition.entity_scopes).some((scope: string) => activeScopes.has(scope))) continue
      if (!hasValue(resolved.get(definition.key))) block({
        code: "REQUIRED_PROPERTY_VALUE_MISSING",
        property: definition.key,
        explanation: `Required property ${definition.key} has no effective value.`,
        repair_action: { action: "assign_required_property", label: "Assign the missing property", target: { property: definition.key } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
        step: 12,
      })
    }
  }

  const relevantIds = new Set((data.scope_chain || []).map((scope) => String(scope.id)))
  ;(data.direct_assignments || []).forEach((item: any) => relevantIds.add(String(item.component_id)))
  ;(data.capability_profiles || []).forEach((profile: any) => collectStrings(profile).forEach((id) => relevantIds.add(id)))
  const relevantRelations = production
    ? (data.relations || []).filter((item: any) => relevantIds.has(String(item.source_id)) || relevantIds.has(String(item.target_id)))
    : (data.relations || [])
  const unmappedRelations = relevantRelations.filter((item: any) => (relationTypes.get(item.relation_type_id) as any)?.status !== "engine_mapped")
  for (const relation of unmappedRelations) {
    const definition: any = relationTypes.get(relation.relation_type_id)
    const item: FindingInput = {
      code: definition?.status === "informational" ? "RELATION_INFORMATIONAL_ONLY" : "RELATION_UNMAPPED",
      relation_id: relation.id,
      relation: definition?.key || relation.relation_type_id,
      affected_entity: { type: relation.source_type || "relation", id: String(relation.source_id), label: definition?.name },
      explanation: definition?.status === "informational"
        ? "This relation is intentionally informational and is not enforced by the engine."
        : "A relation used by the server is not mapped to deterministic engine behavior.",
      repair_action: { action: "map_relation_type", label: "Map the relation type to an engine validator", target: { relation_id: relation.id } },
      deep_link: "/server-configurator/knowledge-base?entity=technology_relation",
    }
    if (definition?.status === "informational") warn(item)
    else {
      block(item)
      recommend("map_relation_type", { relation_id: relation.id })
    }
  }

  const selected = selectedComponents(data)
  resolveRelations(data, selected.components).issues.forEach((issue) => block({
    code: issue.code,
    component_id: issue.component_id,
    affected_entity: { type: "component", id: String(issue.component_id || "unresolved") },
    explanation: "A component has an unresolved provider or consumer relation.",
    repair_action: { action: "repair_component_relation", label: "Repair the component relation", target: { component_id: issue.component_id } },
    deep_link: "/server-configurator/knowledge-base?entity=technology_relation",
  }))

  const candidates = resolveCandidates(data)
  const manifest = options.manifest
  if (mode === "bulk_dry_run" && manifest) {
    const creates = array<any>(manifest.planned_creates_json)
    const identities = creates.map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)
    unique(identities.filter((identity, index) => identities.indexOf(identity) !== index)).forEach((identity) => block({
      code: "MANIFEST_DUPLICATE_IDENTITY",
      explanation: `The manifest contains duplicate identity ${identity}.`,
      repair_action: { action: "deduplicate_manifest", label: "Remove or merge duplicate nodes", target: { identity } },
      deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
    }))
    const nodes = array<any>(manifest.dependency_nodes || manifest.planned_links_json)
    const ids = new Set(nodes.map((node) => node.id))
    nodes.forEach((node) => array<string>(node.depends_on).forEach((dependency) => {
      if (!ids.has(dependency)) block({
        code: "MANIFEST_DEPENDENCY_MISSING",
        affected_entity: { type: "manifest_node", id: String(node.id) },
        explanation: `Manifest node ${node.id} depends on missing node ${dependency}.`,
        repair_action: { action: "repair_manifest_dependency", label: "Repair the missing dependency", target: { node_id: node.id, dependency } },
        deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
      })
    }))
    const graph = new Map(nodes.map((node) => [node.id, array<string>(node.depends_on)]))
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const cyclic = (id: string): boolean => {
      if (visiting.has(id)) return true
      if (visited.has(id)) return false
      visiting.add(id)
      if ((graph.get(id) || []).some(cyclic)) return true
      visiting.delete(id)
      visited.add(id)
      return false
    }
    if ([...graph.keys()].some(cyclic)) block({
      code: "MANIFEST_DEPENDENCY_CYCLE",
      explanation: "The bulk manifest contains a dependency cycle.",
      repair_action: { action: "break_manifest_cycle", label: "Break the dependency cycle" },
      deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
    })
  }

  if (production && data.model) {
    const modelId = String(data.model.id)
    const profile = (data.capability_profiles || []).find((item: any) => item.owner_type === "server_model" && item.owner_id === modelId)
    if (!profile) block({
      code: "CAPABILITY_PROFILE_MISSING",
      explanation: "The server has no direct CapabilityProfile.",
      repair_action: { action: "create_capability_profile", label: "Complete the server capability profile", target: { server_model_id: modelId } },
      step: 4,
    })
    else if (profile.review_status !== "verified") warn({
      code: "CAPABILITY_PROFILE_NOT_VERIFIED",
      affected_entity: { type: "capability_profile", id: profile.id, label: data.model.public_name },
      explanation: "The capability profile exists but has not been verified by an administrator.",
      repair_action: { action: "review_capability_profile", label: "Review and verify the profile", target: { capability_profile_id: profile.id } },
      step: 14,
    })

    const storageOptions = (data.storage_options || []).filter((item: any) => item.enabled !== false)
    if (!storageOptions.length) block({
      code: "STORAGE_OPTION_MISSING",
      explanation: "At least one enabled storage option is required.",
      repair_action: { action: "create_storage_option", label: "Define storage and backplane options", target: { server_model_id: modelId } },
      step: 6,
    })
    storageOptions.forEach((option: any) => {
      const entity = { type: "storage_option", id: option.id, label: option.public_name || option.key }
      const checks = [
        ["STORAGE_CAGES_MISSING", option.storage_cages_json, "Define physical storage cages and bay groups", "define_storage_cages"],
        ["STORAGE_DRIVE_LIMITS_MISSING", option.drive_limits_json, "Define drive quantity and protocol limits", "define_drive_limits"],
        ["STORAGE_BACKPLANE_MISSING", option.backplane_variants_json, "Map supported backplane variants", "define_backplane_variants"],
      ] as const
      checks.forEach(([code, value, label, action]) => {
        if (!hasValue(value)) block({
          code,
          affected_entity: entity,
          explanation: `${entity.label} is incomplete: ${label.toLowerCase()}.`,
          repair_action: { action, label, target: { storage_option_id: option.id } },
          step: 6,
        })
      })
      if (!hasValue(option.suggested_drive_packs_json)) improve({
        code: "SUGGESTED_DRIVE_PACKS_MISSING",
        affected_entity: entity,
        explanation: "No reviewed drive pack is suggested for this storage option.",
        repair_action: { action: "assign_suggested_drive_pack", label: "Assign a suggested drive pack", target: { storage_option_id: option.id } },
        deep_link: "/server-configurator/component-packs",
      })
    })

    const activePackIds = new Set((data.pack_assignments || []).filter((item: any) => item.enabled !== false && item.inheritance_behavior !== "exclude").map((item: any) => item.component_pack_id))
    const packedComponents = new Set((data.pack_items || []).filter((item: any) => item.enabled !== false && activePackIds.has(item.component_pack_id)).map((item: any) => item.component_id))
    const allAssignments = (data as any).all_direct_assignments || data.direct_assignments || []
    for (const assignment of data.direct_assignments || []) {
      const component: any = components.get(assignment.component_id)
      const entity = { type: "direct_component_assignment", id: assignment.id, label: component?.public_name || assignment.component_id }
      const directLink = link(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`)
      if (!component || component.enabled === false) {
        block({
          code: "DIRECT_COMPONENT_UNAVAILABLE",
          assignment_id: assignment.id,
          component_id: assignment.component_id,
          affected_entity: entity,
          explanation: "A direct assignment references a missing or disabled component.",
          repair_action: { action: "replace_direct_component", label: "Replace or remove the component", target: { assignment_id: assignment.id } },
          deep_link: directLink,
        })
        continue
      }
      const typeDefinition: any = componentTypes.get(component.type)
      if (!typeDefinition) block({
        code: "COMPONENT_TYPE_DEFINITION_MISSING",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `Component type ${component.type} has no canonical definition.`,
        repair_action: { action: "create_component_type_definition", label: "Create the component type definition", target: { component_type: component.type } },
        deep_link: "/server-configurator/knowledge-base?entity=component_type_definition",
      })
      else if (typeDefinition.compatibility_mode === "validated" && !typeDefinition.validator_key && !hasValue(typeDefinition.facts_mapping_json)) block({
        code: "COMPONENT_TYPE_VALIDATOR_MISSING",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `Validated type ${component.type} is not mapped to engine facts or a validator.`,
        repair_action: { action: "map_component_type_validator", label: "Map the component type", target: { component_type: component.type } },
        deep_link: "/server-configurator/knowledge-base?entity=component_type_definition",
      })
      const min = Number(assignment.min_quantity)
      const max = Number(assignment.max_quantity)
      const defaultQuantity = Number(assignment.default_quantity)
      if (min > max || defaultQuantity < min || defaultQuantity > max) block({
        code: "DIRECT_COMPONENT_QUANTITY_INVALID",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "Default, minimum and maximum quantities are inconsistent.",
        repair_action: { action: "repair_assignment_quantity", label: "Correct quantity limits", target: { assignment_id: assignment.id } },
        deep_link: directLink,
      })
      if (assignment.selection_mode === "hidden_technical" && !["auto_added_technical", "required_component", "enablement_kit"].includes(assignment.assignment_role)) block({
        code: "HIDDEN_TECHNICAL_ROLE_INVALID",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "An optional direct component cannot be silently hidden.",
        repair_action: { action: "repair_hidden_component_role", label: "Change the role or make it visible", target: { assignment_id: assignment.id } },
        deep_link: directLink,
      })
      if (assignment.assignment_role === "auto_added_technical" && (defaultQuantity < 1 || (!hasValue(assignment.requirements_override_json) && !hasValue(component.requirements_json) && !hasValue(assignment.notes)))) block({
        code: "AUTO_ADDED_TRIGGER_MISSING",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "An auto-added component needs a positive quantity and deterministic trigger requirements.",
        repair_action: { action: "define_auto_add_trigger", label: "Define the trigger and quantity", target: { assignment_id: assignment.id } },
        deep_link: directLink,
      })
      if (assignment.assignment_role === "enablement_kit" && !hasValue(assignment.provides_override_json) && !hasValue(component.provides_json)) block({
        code: "ENABLEMENT_KIT_PROVIDES_MISSING",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "An enablement kit must declare what capability it provides.",
        repair_action: { action: "define_enablement_kit_provides", label: "Define provided capabilities", target: { assignment_id: assignment.id } },
        deep_link: directLink,
      })
      if (packedComponents.has(component.id)) warn({
        code: "DIRECT_COMPONENT_DUPLICATES_PACK",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "The component is sourced both directly and through an active pack.",
        repair_action: { action: "deduplicate_component_source", label: "Keep one candidate source", target: { assignment_id: assignment.id } },
        deep_link: "/server-configurator/component-packs",
      })
      const reuseCount = allAssignments.filter((item: any) => item.enabled !== false && item.component_id === component.id).length
      if (reuseCount >= 3) improve({
        code: "DIRECT_COMPONENT_HIGH_REUSE",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `This component is assigned directly to ${reuseCount} server models.`,
        repair_action: { action: "convert_direct_to_pack", label: "Review conversion to a reusable pack", target: { component_id: component.id } },
        deep_link: "/server-configurator/smart-builder",
      })
    }

    for (const group of data.option_groups || []) {
      const entity = { type: "configurator_option_group", id: group.id, label: group.title || group.key }
      const groupLink = link(data, "/server-configurator/option-groups", 10)
      if (!hasValue(group.source_types_json)) block({
        code: "OPTION_GROUP_SOURCE_MISSING",
        affected_entity: entity,
        explanation: "The option group has no candidate source type.",
        repair_action: { action: "assign_option_group_source", label: "Select candidate sources", target: { option_group_id: group.id } },
        deep_link: groupLink,
        step: 10,
      })
      if (Number(group.min_quantity) > Number(group.max_quantity)) block({
        code: "OPTION_GROUP_CARDINALITY_INVALID",
        affected_entity: entity,
        explanation: "The option group minimum exceeds its maximum.",
        repair_action: { action: "repair_option_group_cardinality", label: "Correct the group cardinality", target: { option_group_id: group.id } },
        deep_link: groupLink,
        step: 10,
      })
      if (["exactly_one", "one_or_many"].includes(group.selection_cardinality) && group.allow_none) block({
        code: "OPTION_GROUP_NONE_CONFLICT",
        affected_entity: entity,
        explanation: "A required option group cannot allow an explicit none state.",
        repair_action: { action: "repair_option_group_none_state", label: "Make the group optional or disable none", target: { option_group_id: group.id } },
        deep_link: groupLink,
        step: 10,
      })
      if (group.allow_none && !group.none_label) warn({
        code: "OPTION_GROUP_NONE_LABEL_MISSING",
        affected_entity: entity,
        explanation: "The explicit none state has no clear storefront label.",
        repair_action: { action: "add_none_label", label: "Add a none-state label", target: { option_group_id: group.id } },
        deep_link: groupLink,
        step: 10,
      })
    }
  }

  const referencedConceptIds = new Set(relevantRelations.flatMap((item: any) => [item.source_id, item.target_id]))
  const unusedConcepts = (data.concepts || []).filter((item: any) => !referencedConceptIds.has(item.id)).map((item: any) => item.id)
  const visibleBlockers = mode === "guided_check" ? blockers.slice(0, 1) : blockers
  const findings = [...visibleBlockers, ...warnings, ...improvements]
  if (!visibleBlockers.length) findings.push(makeFinding(data, "complete", {
    code: "PUBLICATION_READINESS_COMPLETE",
    explanation: production ? "All deterministic publication gates passed." : "No blockers were found for this readiness mode.",
    repair_action: { action: "none", label: "No repair required" },
    revalidation_required: false,
    deep_link: link(data, "/server-configurator/server-wizard", 14),
  }))

  return {
    mode,
    ready: blockers.length === 0,
    publication_allowed: production && blockers.length === 0,
    status: blockers.length ? "unresolved" : "ready",
    entity_readiness: {
      server_model: Boolean(data.model),
      properties: !blockers.some((item) => item.code.includes("PROPERTY")),
      relations: !blockers.some((item) => item.code.includes("RELATION") || item.code.includes("PROVIDER")),
      validators: !blockers.some((item) => item.code.includes("VALIDATOR")),
      storage: !blockers.some((item) => item.code.includes("STORAGE")),
      direct_components: !blockers.some((item) => ["DIRECT_COMPONENT", "AUTO_ADDED", "ENABLEMENT_KIT", "HIDDEN_TECHNICAL"].some((key) => item.code.includes(key))),
      option_groups: !blockers.some((item) => item.code.includes("OPTION_GROUP")),
    },
    resolved_properties: propertyResolution.properties,
    inherited_provenance: propertyResolution.properties.map((item) => ({ key: item.key, chain: item.inheritance_chain })),
    unresolved_properties: blockers.filter((item) => item.code.includes("PROPERTY")),
    unmapped_relations: unmappedRelations.filter((item: any) => (relationTypes.get(item.relation_type_id) as any)?.status !== "informational").map((item: any) => item.id),
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
    blockers: visibleBlockers,
    warnings,
    optional_improvements: improvements,
    findings,
    blocking_error_count: visibleBlockers.length,
    warning_count: warnings.length,
    optional_improvement_count: improvements.length,
    recommendations,
    proposed_mappings: mode === "assisted_preview" ? recommendations.filter((item) => item.action === "assign_validator" || item.action === "map_relation_type") : [],
    predicted_effects: mode === "assisted_preview" ? { blockers_after_repair: Math.max(0, blockers.length - recommendations.length) } : undefined,
    idempotent: mode === "bulk_dry_run"
      ? unique(array<any>(manifest?.planned_creates_json).map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)).length === array(manifest?.planned_creates_json).length
      : true,
    partial: Boolean(data.partial),
    compatible: false,
    recommended_next_actions: recommendations,
  }
}
