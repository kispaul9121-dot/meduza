import { CompatibilityData, ValidationMode } from "./types"
import { array, unique } from "./utils"
import { resolveCandidates } from "./candidate-resolver"
import { resolveProperties } from "./property-resolver"
import { resolveRelations } from "./relation-resolver"
import { selectedComponents } from "./facts"

type PublishingSeverity = "blocking_error" | "warning" | "optional_improvement" | "complete"

type ReadinessFinding = {
  code: string
  severity: PublishingSeverity
  affected_entity: { type: string; id: string; label?: string }
  property?: string
  concept?: string
  relation?: string
  inherited_source?: { type: string; id: string } | null
  explanation: string
  repair_action: { action: string; label: string; target?: Record<string, unknown> }
  deep_link: string
  revalidation_required: boolean
  step?: number
  path?: string
  component_id?: string
  assignment_id?: string
  relation_id?: string
  expected?: unknown
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

function configured(value: unknown) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0
  return value !== null && value !== undefined && value !== ""
}

function collectStrings(value: unknown, result = new Set<string>()) {
  if (typeof value === "string" && value) result.add(value)
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, result))
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, result))
  return result
}

function modelLink(data: CompatibilityData, path: string, step?: number) {
  const modelId = encodeURIComponent(String(data.model?.id || ""))
  const params = new URLSearchParams()
  if (modelId) params.set("server_model_id", modelId)
  if (step) params.set("step", String(step))
  params.set("mode", "guided_manual")
  return `${path}?${params.toString()}`
}

function finding(data: CompatibilityData, input: Omit<ReadinessFinding, "affected_entity" | "deep_link" | "revalidation_required"> & {
  affected_entity?: ReadinessFinding["affected_entity"]
  deep_link?: string
  revalidation_required?: boolean
}): ReadinessFinding {
  return {
    ...input,
    affected_entity: input.affected_entity || {
      type: "server_model",
      id: String(data.model?.id || "unresolved"),
      label: data.model?.public_name || data.model?.slug || "Unresolved server model",
    },
    deep_link: input.deep_link || modelLink(data, "/server-configurator/server-wizard", input.step),
    revalidation_required: input.revalidation_required ?? true,
  }
}

export function validateReadiness(data: CompatibilityData, options: { mode?: ValidationMode; manifest?: any } = {}) {
  const mode = options.mode || data.mode || "guided_check"
  const production = mode === "production_validation"
  const definitions = new Map((data.property_definitions || []).map((definition: any) => [definition.id, definition]))
  const relationTypes = new Map((data.relation_type_definitions || []).map((definition: any) => [definition.id, definition]))
  const components = new Map((data.components || []).map((component: any) => [component.id, component]))
  const componentTypes = new Map((data.component_type_definitions || []).map((definition: any) => [definition.key, definition]))
  const blockers: ReadinessFinding[] = []
  const warnings: ReadinessFinding[] = []
  const improvements: ReadinessFinding[] = []
  const repair: Array<{ action: string; [key: string]: unknown }> = []

  const block = (item: Parameters<typeof finding>[1]) => blockers.push(finding(data, { ...item, severity: "blocking_error" }))
  const warn = (item: Parameters<typeof finding>[1]) => warnings.push(finding(data, { ...item, severity: "warning" }))
  const improve = (item: Parameters<typeof finding>[1]) => improvements.push(finding(data, { ...item, severity: "optional_improvement", revalidation_required: false }))
  const recommend = (action: string, details: Record<string, unknown> = {}) => repair.push({ action, ...details })

  if (data.partial) block({
    code: "PARTIAL_GRAPH_UNRESOLVED",
    explanation: "The compatibility graph is partial, so publication would rely on unresolved data.",
    repair_action: { action: "complete_graph", label: "Complete the server graph in Guided Manual mode" },
    step: 12,
  })

  if (!data.model) block({
    code: "SERVER_MODEL_MISSING",
    explanation: "The requested server model does not exist or is no longer accessible.",
    repair_action: { action: "select_server_model", label: "Select an existing server model" },
    deep_link: "/server-configurator/models",
  })

  for (const assignment of data.property_assignments || []) {
    const definition = definitions.get(assignment.property_definition_id) as any
    if (!definition) {
      block({
        code: "PROPERTY_DEFINITION_MISSING",
        assignment_id: assignment.id,
        explanation: "A property assignment points to a missing canonical PropertyDefinition.",
        repair_action: { action: "create_property_definition", label: "Create or relink the property definition", target: { assignment_id: assignment.id } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
      })
      recommend("create_property_definition", { assignment_id: assignment.id })
      continue
    }
    const inheritedSource = assignment.inherited_from_id ? { type: assignment.inherited_from_type || "unknown", id: assignment.inherited_from_id } : null
    if (!array(definition.entity_scopes).includes(assignment.owner_type)) block({
      code: "PROPERTY_SCOPE_NOT_ALLOWED",
      assignment_id: assignment.id,
      property: definition.key,
      inherited_source: inheritedSource,
      explanation: `Property ${definition.key} is assigned to an unsupported entity scope ${assignment.owner_type}.`,
      repair_action: { action: "move_property_assignment", label: "Move the value to an allowed scope", target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
    if (!matchesValueType(assignment.value_json, definition.value_type)) block({
      code: "PROPERTY_VALUE_TYPE_INVALID",
      assignment_id: assignment.id,
      property: definition.key,
      inherited_source: inheritedSource,
      expected: definition.value_type,
      explanation: `Property ${definition.key} does not match its canonical ${definition.value_type} value type.`,
      repair_action: { action: "normalize_property_value", label: "Normalize the assigned value", target: { property: definition.key, expected: definition.value_type } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
    if (definition.unit && assignment.value_json?.unit && definition.unit !== assignment.value_json.unit) block({
      code: "PROPERTY_UNIT_INVALID",
      assignment_id: assignment.id,
      property: definition.key,
      inherited_source: inheritedSource,
      expected: definition.unit,
      explanation: `Property ${definition.key} uses a unit that conflicts with the canonical definition.`,
      repair_action: { action: "normalize_property_unit", label: `Convert the value to ${definition.unit}`, target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
    if (definition.affects_compatibility && !definition.validator_key && !definition.fact_path) {
      block({
        code: "PROPERTY_VALIDATOR_MISSING",
        property: definition.key,
        inherited_source: inheritedSource,
        explanation: `Compatibility property ${definition.key} is not mapped to an engine fact or validator.`,
        repair_action: { action: "assign_validator", label: "Map the property to a fact path or validator", target: { property: definition.key } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
      })
      recommend("assign_validator", { property: definition.key })
    }
    if (production && definition.lifecycle_status === "deprecated") warn({
      code: "DEPRECATED_PROPERTY_IN_USE",
      property: definition.key,
      inherited_source: inheritedSource,
      explanation: `Deprecated property ${definition.key} is still used by this model.`,
      repair_action: { action: "replace_deprecated_property", label: "Replace the deprecated property", target: { property: definition.key } },
      deep_link: "/server-configurator/knowledge-base?entity=property_definition",
    })
  }

  const propertyResolution = resolveProperties(data)
  for (const issue of propertyResolution.issues) block({
    code: issue.code,
    path: issue.path,
    explanation: `Property resolution failed at ${issue.path || "an unresolved path"}.`,
    repair_action: { action: "resolve_property_conflict", label: "Review inherited and direct property values", target: { path: issue.path } },
    deep_link: "/server-configurator/knowledge-base?entity=property_definition",
  })

  if (production) {
    const resolvedByKey = new Map(propertyResolution.properties.filter((item: any) => !item.excluded).map((item: any) => [item.key, item]))
    const activeScopes = new Set((data.scope_chain || []).map((scope) => scope.type))
    for (const definition of data.property_definitions || []) {
      if (!definition.required || !array(definition.entity_scopes).some((scope: string) => activeScopes.has(scope))) continue
      const resolved: any = resolvedByKey.get(definition.key)
      if (!resolved || resolved.value === null || resolved.value === undefined || resolved.value === "") block({
        code: "REQUIRED_PROPERTY_VALUE_MISSING",
        property: definition.key,
        explanation: `Required property ${definition.key} has no effective value in the server inheritance chain.`,
        repair_action: { action: "assign_required_property", label: "Assign the missing property value", target: { property: definition.key } },
        deep_link: "/server-configurator/knowledge-base?entity=property_definition",
        step: 12,
      })
    }
  }

  const relevantIds = new Set<string>((data.scope_chain || []).map((scope) => scope.id))
  relevantIds.add(String(data.model?.id || ""))
  for (const assignment of data.direct_assignments || []) relevantIds.add(String(assignment.component_id))
  for (const profile of data.capability_profiles || []) collectStrings(profile).forEach((value) => relevantIds.add(value))
  const relevantRelations = production
    ? (data.relations || []).filter((relation: any) => relevantIds.has(String(relation.source_id)) || relevantIds.has(String(relation.target_id)))
    : (data.relations || [])
  const unmappedRelations = relevantRelations.filter((relation: any) => (relationTypes.get(relation.relation_type_id) as any)?.status !== "engine_mapped")
  for (const relation of unmappedRelations) {
    const definition = relationTypes.get(relation.relation_type_id) as any
    const payload = {
      code: definition?.status === "informational" ? "RELATION_INFORMATIONAL_ONLY" : "RELATION_UNMAPPED",
      relation_id: relation.id,
      relation: definition?.key || relation.relation_type_id,
      affected_entity: { type: relation.source_type || "relation", id: String(relation.source_id), label: definition?.name },
      explanation: definition?.status === "informational"
        ? "This relation is intentionally informational and is not enforced by the compatibility engine."
        : "A relation used by this server is not mapped to deterministic engine behavior.",
      repair_action: { action: "map_relation_type", label: "Map the relation type to an engine validator", target: { relation_id: relation.id } },
      deep_link: "/server-configurator/knowledge-base?entity=technology_relation",
    }
    if (definition?.status === "informational") warn(payload)
    else {
      block(payload)
      recommend("map_relation_type", { relation_id: relation.id })
    }
  }

  const selected = selectedComponents(data)
  const relationResolution = resolveRelations(data, selected.components)
  for (const issue of relationResolution.issues) block({
    code: issue.code,
    component_id: issue.component_id,
    affected_entity: { type: "component", id: String(issue.component_id || "unresolved") },
    explanation: "A selected or required component has an unresolved provider/consumer relation.",
    repair_action: { action: "repair_component_relation", label: "Open the component relation mapping", target: { component_id: issue.component_id } },
    deep_link: "/server-configurator/knowledge-base?entity=technology_relation",
  })

  const candidates = resolveCandidates(data)
  const manifest = options.manifest
  if (mode === "bulk_dry_run" && manifest) {
    const creates = array<any>(manifest.planned_creates_json)
    const identities = creates.map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)
    const duplicates = identities.filter((identity, index) => identities.indexOf(identity) !== index)
    for (const identity of unique(duplicates)) block({
      code: "MANIFEST_DUPLICATE_IDENTITY",
      explanation: `The bulk manifest contains duplicate identity ${identity}.`,
      repair_action: { action: "deduplicate_manifest", label: "Remove or merge duplicate manifest nodes", target: { identity } },
      deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
    })
    const nodes = array<any>(manifest.dependency_nodes || manifest.planned_links_json)
    const ids = new Set(nodes.map((node) => node.id))
    for (const node of nodes) for (const dependency of array<string>(node.depends_on)) if (!ids.has(dependency)) block({
      code: "MANIFEST_DEPENDENCY_MISSING",
      affected_entity: { type: "manifest_node", id: String(node.id) },
      explanation: `Manifest node ${node.id} depends on missing node ${dependency}.`,
      repair_action: { action: "repair_manifest_dependency", label: "Add or remove the missing dependency", target: { node_id: node.id, dependency } },
      deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
    })
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
    if ([...graph.keys()].some(hasCycle)) block({
      code: "MANIFEST_DEPENDENCY_CYCLE",
      explanation: "The bulk creation manifest contains a dependency cycle.",
      repair_action: { action: "break_manifest_cycle", label: "Break the dependency cycle before apply" },
      deep_link: "/server-configurator/genius-bootstrap?mode=bulk_apply",
    })
  }

  if (production && data.model) {
    const modelId = String(data.model.id)
    const directProfile = (data.capability_profiles || []).find((profile: any) => profile.owner_type === "server_model" && profile.owner_id === modelId)
    if (!directProfile) block({
      code: "CAPABILITY_PROFILE_MISSING",
      explanation: "The server has no direct CapabilityProfile, so the storefront and engine cannot share one reviewed technical source.",
      repair_action: { action: "create_capability_profile", label: "Complete the server capability profile", target: { server_model_id: modelId } },
      step: 4,
    })
    else if (directProfile.review_status !== "verified") warn({
      code: "CAPABILITY_PROFILE_NOT_VERIFIED",
      affected_entity: { type: "capability_profile", id: directProfile.id, label: data.model.public_name },
      explanation: "The capability profile exists but has not been marked verified by an administrator.",
      repair_action: { action: "review_capability_profile", label: "Review and verify the capability profile", target: { capability_profile_id: directProfile.id } },
      step: 14,
    })

    const storageOptions = (data.storage_options || []).filter((option: any) => option.enabled !== false)
    if (!storageOptions.length) block({
      code: "STORAGE_OPTION_MISSING",
      explanation: "At least one enabled storage option is required for a publishable server configurator.",
      repair_action: { action: "create_storage_option", label: "Define chassis storage and backplane options", target: { server_model_id: modelId } },
      step: 6,
    })
    for (const option of storageOptions) {
      const entity = { type: "storage_option", id: option.id, label: option.public_name || option.key }
      if (!configured(option.storage_cages_json)) block({
        code: "STORAGE_CAGES_MISSING",
        affected_entity: entity,
        explanation: "The storage option has no physical cage or bay definition.",
        repair_action: { action: "define_storage_cages", label: "Define physical storage cages and bay groups", target: { storage_option_id: option.id } },
        step: 6,
      })
      if (!configured(option.drive_limits_json)) block({
        code: "STORAGE_DRIVE_LIMITS_MISSING",
        affected_entity: entity,
        explanation: "Drive quantity and protocol limits are not defined for this storage option.",
        repair_action: { action: "define_drive_limits", label: "Define drive limits", target: { storage_option_id: option.id } },
        step: 6,
      })
      if (!configured(option.backplane_variants_json)) block({
        code: "STORAGE_BACKPLANE_MISSING",
        affected_entity: entity,
        explanation: "The storage option has no backplane variant mapping.",
        repair_action: { action: "define_backplane_variants", label: "Map supported backplane variants", target: { storage_option_id: option.id } },
        step: 6,
      })
      if (!configured(option.suggested_drive_packs_json)) improve({
        code: "SUGGESTED_DRIVE_PACKS_MISSING",
        affected_entity: entity,
        explanation: "No curated drive pack is suggested for this storage option.",
        repair_action: { action: "assign_suggested_drive_pack", label: "Assign a reviewed drive pack", target: { storage_option_id: option.id } },
        deep_link: "/server-configurator/component-packs",
      })
    }

    const activePackIds = new Set((data.pack_assignments || []).filter((item: any) => item.enabled !== false && item.inheritance_behavior !== "exclude").map((item: any) => item.component_pack_id))
    const packedComponentIds = new Set((data.pack_items || []).filter((item: any) => item.enabled !== false && activePackIds.has(item.component_pack_id)).map((item: any) => item.component_id))
    const allDirectAssignments = (data as any).all_direct_assignments || data.direct_assignments || []
    for (const assignment of data.direct_assignments || []) {
      const component: any = components.get(assignment.component_id)
      const entity = { type: "direct_component_assignment", id: assignment.id, label: component?.public_name || assignment.component_id }
      if (!component || component.enabled === false) {
        block({
          code: "DIRECT_COMPONENT_UNAVAILABLE",
          assignment_id: assignment.id,
          component_id: assignment.component_id,
          affected_entity: entity,
          explanation: "A direct assignment references a missing or disabled component.",
          repair_action: { action: "replace_direct_component", label: "Replace or remove the unavailable direct component", target: { assignment_id: assignment.id } },
          deep_link: modelLink(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`),
        })
        continue
      }
      const typeDefinition: any = componentTypes.get(component.type)
      if (!typeDefinition) block({
        code: "COMPONENT_TYPE_DEFINITION_MISSING",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `Component type ${component.type} has no canonical ComponentTypeDefinition.`,
        repair_action: { action: "create_component_type_definition", label: "Create the missing component type definition", target: { component_type: component.type } },
        deep_link: "/server-configurator/knowledge-base?entity=component_type_definition",
      })
      else if (typeDefinition.compatibility_mode === "validated" && !typeDefinition.validator_key && !configured(typeDefinition.facts_mapping_json)) block({
        code: "COMPONENT_TYPE_VALIDATOR_MISSING",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `Validated component type ${component.type} is not mapped to engine facts or a validator.`,
        repair_action: { action: "map_component_type_validator", label: "Map the component type to the compatibility engine", target: { component_type: component.type } },
        deep_link: "/server-configurator/knowledge-base?entity=component_type_definition",
      })
      if (Number(assignment.min_quantity) > Number(assignment.max_quantity) || Number(assignment.default_quantity) < Number(assignment.min_quantity) || Number(assignment.default_quantity) > Number(assignment.max_quantity)) block({
        code: "DIRECT_COMPONENT_QUANTITY_INVALID",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "Default, minimum and maximum quantities are internally inconsistent.",
        repair_action: { action: "repair_assignment_quantity", label: "Correct assignment quantity limits", target: { assignment_id: assignment.id } },
        deep_link: modelLink(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`),
      })
      if (assignment.selection_mode === "hidden_technical" && !["auto_added_technical", "required_component", "enablement_kit"].includes(assignment.assignment_role)) block({
        code: "HIDDEN_TECHNICAL_ROLE_INVALID",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "A hidden technical component must be required, auto-added or an enablement kit; an optional choice cannot be silently hidden.",
        repair_action: { action: "repair_hidden_component_role", label: "Change the role or make the option visible", target: { assignment_id: assignment.id } },
        deep_link: modelLink(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`),
      })
      if (assignment.assignment_role === "auto_added_technical") {
        const triggerEvidence = configured(assignment.requirements_override_json) || configured(component.requirements_json) || configured(assignment.notes)
        if (Number(assignment.default_quantity) < 1 || !triggerEvidence) block({
          code: "AUTO_ADDED_TRIGGER_MISSING",
          assignment_id: assignment.id,
          component_id: component.id,
          affected_entity: entity,
          explanation: "An auto-added technical component needs a positive quantity and deterministic trigger requirements.",
          repair_action: { action: "define_auto_add_trigger", label: "Define the auto-add trigger and quantity", target: { assignment_id: assignment.id } },
          deep_link: modelLink(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`),
        })
      }
      if (assignment.assignment_role === "enablement_kit" && !configured(assignment.provides_override_json) && !configured(component.provides_json)) block({
        code: "ENABLEMENT_KIT_PROVIDES_MISSING",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "An enablement kit must declare the capability or resource that it provides.",
        repair_action: { action: "define_enablement_kit_provides", label: "Define provided capabilities", target: { assignment_id: assignment.id } },
        deep_link: modelLink(data, `/server-configurator/models/${encodeURIComponent(modelId)}/direct-components`),
      })
      if (packedComponentIds.has(component.id)) warn({
        code: "DIRECT_COMPONENT_DUPLICATES_PACK",
        assignment_id: assignment.id,
        component_id: component.id,
        affected_entity: entity,
        explanation: "The component is available both through a pack and a direct assignment, which can create duplicate storefront candidates.",
        repair_action: { action: "deduplicate_component_source", label: "Keep either the pack source or the direct assignment", target: { assignment_id: assignment.id } },
        deep_link: "/server-configurator/component-packs",
      })
      const reuseCount = allDirectAssignments.filter((item: any) => item.enabled !== false && item.component_id === component.id).length
      if (reuseCount >= 3) improve({
        code: "DIRECT_COMPONENT_HIGH_REUSE",
        component_id: component.id,
        affected_entity: { type: "component", id: component.id, label: component.public_name },
        explanation: `This component is assigned directly to ${reuseCount} server models and may be easier to maintain as a reusable pack.`,
        repair_action: { action: "convert_direct_to_pack", label: "Review conversion to a reusable component pack", target: { component_id: component.id } },
        deep_link: "/server-configurator/smart-builder",
      })
    }

    for (const group of data.option_groups || []) {
      const entity = { type: "configurator_option_group", id: group.id, label: group.title || group.key }
      if (!configured(group.source_types_json)) block({
        code: "OPTION_GROUP_SOURCE_MISSING",
        affected_entity: entity,
        explanation: "The option group has no candidate source type, so it cannot resolve storefront choices.",
        repair_action: { action: "assign_option_group_source", label: "Select pack, direct, topology or bundle sources", target: { option_group_id: group.id } },
        deep_link: modelLink(data, "/server-configurator/option-groups"),
        step: 10,
      })
      if (Number(group.min_quantity) > Number(group.max_quantity)) block({
        code: "OPTION_GROUP_CARDINALITY_INVALID",
        affected_entity: entity,
        explanation: "The option group minimum quantity exceeds its maximum quantity.",
        repair_action: { action: "repair_option_group_cardinality", label: "Correct minimum and maximum quantities", target: { option_group_id: group.id } },
        deep_link: modelLink(data, "/server-configurator/option-groups"),
        step: 10,
      })
      if (["exactly_one", "one_or_many"].includes(group.selection_cardinality) && group.allow_none) block({
        code: "OPTION_GROUP_NONE_CONFLICT",
        affected_entity: entity,
        explanation: "A required option group cannot simultaneously allow an explicit none state.",
        repair_action: { action: "repair_option_group_none_state", label: "Make the group optional or disable none", target: { option_group_id: group.id } },
        deep_link: modelLink(data, "/server-configurator/option-groups"),
        step: 10,
      })
      if (group.allow_none && !group.none_label) warn({
        code: "OPTION_GROUP_NONE_LABEL_MISSING",
        affected_entity: entity,
        explanation: "The group supports a real none state but has no clear storefront label for it.",
        repair_action: { action: "add_none_label", label: "Add a human-readable none label", target: { option_group_id: group.id } },
        deep_link: modelLink(data, "/server-configurator/option-groups"),
        step: 10,
      })
    }
  }

  const referencedConceptIds = new Set(relevantRelations.flatMap((relation: any) => [relation.source_id, relation.target_id]))
  const unusedConcepts = (data.concepts || []).filter((concept: any) => !referencedConceptIds.has(concept.id)).map((concept: any) => concept.id)
  const resultBlockers = mode === "guided_check" ? blockers.slice(0, 1) : blockers
  const findings: ReadinessFinding[] = [...resultBlockers, ...warnings, ...improvements]
  if (!resultBlockers.length) findings.push(finding(data, {
    code: "PUBLICATION_READINESS_COMPLETE",
    severity: "complete",
    explanation: production ? "All deterministic publication gates passed." : "No blockers were found for the selected readiness mode.",
    repair_action: { action: "none", label: "No repair required" },
    revalidation_required: false,
    deep_link: modelLink(data, "/server-configurator/server-wizard", 14),
  }))

  return {
    mode,
    ready: blockers.length === 0,
    publication_allowed: production && blockers.length === 0,
    status: blockers.length ? "unresolved" : "ready",
    entity_readiness: {
      server_model: Boolean(data.model),
      properties: propertyResolution.issues.length === 0 && !blockers.some((item) => item.code.includes("PROPERTY")),
      relations: !blockers.some((item) => item.code.includes("RELATION") || item.code.includes("PROVIDER")),
      validators: !blockers.some((item) => item.code.includes("VALIDATOR")),
      storage: !blockers.some((item) => item.code.includes("STORAGE")),
      direct_components: !blockers.some((item) => item.code.includes("DIRECT_COMPONENT") || item.code.includes("AUTO_ADDED") || item.code.includes("ENABLEMENT_KIT")),
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
    blockers: resultBlockers,
    warnings,
    optional_improvements: improvements,
    findings,
    blocking_error_count: resultBlockers.length,
    warning_count: warnings.length,
    optional_improvement_count: improvements.length,
    recommendations: repair,
    proposed_mappings: mode === "assisted_preview" ? repair.filter((item) => item.action === "assign_validator" || item.action === "map_relation_type") : [],
    predicted_effects: mode === "assisted_preview" ? { blockers_after_repair: Math.max(0, blockers.length - repair.length) } : undefined,
    idempotent: mode === "bulk_dry_run" ? unique(array<any>(manifest?.planned_creates_json).map((item) => `${item.entity_type}:${item.key || item.id || item.slug}`)).length === array(manifest?.planned_creates_json).length : true,
    partial: Boolean(data.partial),
    compatible: false,
    recommended_next_actions: repair,
  }
}
