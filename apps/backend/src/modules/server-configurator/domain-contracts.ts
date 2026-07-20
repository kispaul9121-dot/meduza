export const COMPONENT_TYPE_KEYS = [
  "cpu",
  "ram",
  "drive",
  "raid",
  "nic",
  "psu",
  "riser",
  "backplane",
  "drive_cage",
  "boot_storage",
  "accelerator",
  "cooling",
  "cable",
  "rails",
  "license",
  "service",
] as const

export const ACCELERATOR_SUBTYPES = ["gpu", "fpga", "dpu", "ai_accelerator"] as const

export const RELATION_TYPE_KEYS = [
  "requires",
  "provides",
  "consumes",
  "accepts",
  "supports",
  "converts_to",
  "conflicts_with",
  "qualified_for",
  "enables",
  "replaces",
  "member_of",
] as const

export const CAPABILITY_SECTIONS = [
  "platform",
  "cpu",
  "memory",
  "storage",
  "expansion",
  "network",
  "accelerator",
  "boot_storage",
  "power",
  "cooling",
  "management",
] as const

export type PropertyDefinitionContract = {
  key: string
  affects_compatibility: boolean
  fact_path?: string | null
  validator_key?: string | null
  usage_status: string
}

export function effectivePropertyStatus(definition: PropertyDefinitionContract) {
  if (
    definition.affects_compatibility &&
    !definition.fact_path &&
    !definition.validator_key
  ) {
    return "unmapped_compatibility_property" as const
  }
  return definition.usage_status
}

export type LegacyComponentRecord = {
  specs_json?: Record<string, unknown> | null
  normalized_specs_json?: Record<string, unknown> | null
  raw_specs_json?: Record<string, unknown> | null
  source_json?: Record<string, unknown> | null
  schema_version?: number | null
}

export function adaptLegacyComponent(record: LegacyComponentRecord) {
  const legacy = record.specs_json || {}
  return {
    normalized_specs_json: record.normalized_specs_json || legacy,
    raw_specs_json: record.raw_specs_json || legacy,
    source_json: record.source_json || {
      adapter: "legacy_specs_json_v1",
      source_doc_reference:
        typeof legacy.source_doc_reference === "string"
          ? legacy.source_doc_reference
          : null,
    },
    schema_version: record.schema_version || 1,
  }
}

export function canonicalComponentPayload(
  input: Record<string, unknown>
): Record<string, unknown> & {
  normalized_specs_json: Record<string, unknown>
  raw_specs_json: Record<string, unknown>
  source_json: Record<string, unknown>
  schema_version: number
  normalization_status: unknown
} {
  const specs =
    input.specs_json && typeof input.specs_json === "object"
      ? (input.specs_json as Record<string, unknown>)
      : null
  const canonical = adaptLegacyComponent({
    specs_json: specs,
    normalized_specs_json:
      input.normalized_specs_json && typeof input.normalized_specs_json === "object"
        ? (input.normalized_specs_json as Record<string, unknown>)
        : null,
    raw_specs_json:
      input.raw_specs_json && typeof input.raw_specs_json === "object"
        ? (input.raw_specs_json as Record<string, unknown>)
        : null,
    source_json:
      input.source_json && typeof input.source_json === "object"
        ? (input.source_json as Record<string, unknown>)
        : null,
    schema_version:
      typeof input.schema_version === "number" ? input.schema_version : null,
  })

  return {
    ...input,
    ...canonical,
    normalization_status:
      input.normalization_status || (specs ? "partially_normalized" : "unmapped"),
  }
}

export function componentContractErrors(input: Record<string, unknown>) {
  const errors: string[] = []
  const type = String(input.type || "")
  if (!COMPONENT_TYPE_KEYS.includes(type as (typeof COMPONENT_TYPE_KEYS)[number])) {
    errors.push(`Unknown component type: ${type}`)
  }
  if (type === "accelerator") {
    const specs = (input.normalized_specs_json || input.specs_json || {}) as Record<string, unknown>
    if (!ACCELERATOR_SUBTYPES.includes(specs.subtype as (typeof ACCELERATOR_SUBTYPES)[number])) {
      errors.push("Accelerator subtype must be gpu, fpga, dpu or ai_accelerator.")
    }
  }
  return errors
}

export function componentTypeDefinitionErrors(
  definition: { key: string; compatibility_mode: string; validator_key?: string | null } | null
) {
  if (!definition) return ["Component type is not registered."]
  if (definition.compatibility_mode !== "informational" && !definition.validator_key) {
    return [`Component type has no validator mapping: ${definition.key}`]
  }
  return []
}

export type InheritedAssignment = {
  id: string
  scope_type: string
  scope_id: string
  component_pack_id: string
  enabled: boolean
  priority: number
  inheritance_behavior: "inherit" | "override" | "exclude"
}

export function resolvePackAssignments(
  hierarchy: Array<{ scope_type: string; scope_id: string }>,
  assignments: InheritedAssignment[]
) {
  const resolved = new Map<
    string,
    InheritedAssignment & { inherited_from: { scope_type: string; scope_id: string } }
  >()

  for (const scope of hierarchy) {
    const scoped = assignments
      .filter(
        (assignment) =>
          assignment.scope_type === scope.scope_type &&
          assignment.scope_id === scope.scope_id
      )
      .sort((left, right) => left.priority - right.priority)

    for (const assignment of scoped) {
      if (assignment.inheritance_behavior === "exclude" || !assignment.enabled) {
        resolved.delete(assignment.component_pack_id)
        continue
      }
      resolved.set(assignment.component_pack_id, {
        ...assignment,
        inherited_from: scope,
      })
    }
  }

  return [...resolved.values()]
}

export type DrivePackCandidate = {
  pack_id: string
  form_factors: string[]
  protocols: string[]
  requires_adapter?: string | null
  qualification_scope_ids?: string[]
  required_controller_capabilities?: string[]
  minimum_bays?: number
}

export type StorageOptionFacts = {
  accepted_form_factors: string[]
  protocols: string[]
  approved_adapters: string[]
  controller_capabilities: string[]
  scope_ids: string[]
  bay_count: number
}

export function suggestDrivePackCandidates(
  storage: StorageOptionFacts,
  packs: DrivePackCandidate[]
) {
  return packs.map((pack) => {
    const formFactor = pack.form_factors.some((value) =>
      storage.accepted_form_factors.includes(value)
    )
    const protocol = pack.protocols.some((value) => storage.protocols.includes(value))
    const adapter = !pack.requires_adapter || storage.approved_adapters.includes(pack.requires_adapter)
    const qualification =
      !pack.qualification_scope_ids?.length ||
      pack.qualification_scope_ids.some((value) => storage.scope_ids.includes(value))
    const controller = (pack.required_controller_capabilities || []).every((value) =>
      storage.controller_capabilities.includes(value)
    )
    const baysAvailable = storage.bay_count >= (pack.minimum_bays || 1)
    const suggested = formFactor && protocol && adapter && qualification && controller && baysAvailable

    return {
      pack_id: pack.pack_id,
      suggested,
      reasons: {
        form_factor: formFactor,
        protocol,
        adapter,
        qualification,
        controller,
        bays_available: baysAvailable,
      },
    }
  })
}

export type CoverageInput = {
  properties: Array<{
    id: string
    key: string
    affects_compatibility: boolean
    fact_path?: string | null
    validator_key?: string | null
    lifecycle_status: string
  }>
  property_values: Array<{ property_definition_id: string }>
  relation_types: Array<{ id: string; key: string; status: string; validator_key?: string | null }>
  relations: Array<{ relation_type_id: string; source_id: string; target_id: string }>
  concepts: Array<{ id: string; stable_key: string }>
  aliases: Array<{ technology_concept_id: string; normalized_alias: string }>
  packs: Array<{ id: string; slug: string }>
  assignments: Array<{
    component_pack_id: string
    scope_type: string
    scope_id: string
    enabled?: boolean
    inheritance_behavior?: string
    overrides_json?: { unresolved_conflicts?: unknown[] } | null
  }>
}

export function calculateDomainCoverage(input: CoverageInput) {
  const usedProperties = new Set(input.property_values.map((value) => value.property_definition_id))
  const usedRelationTypes = new Set(input.relations.map((relation) => relation.relation_type_id))
  const relatedConcepts = new Set(
    input.relations.flatMap((relation) => [relation.source_id, relation.target_id])
  )
  const assignedPacks = new Set(
    input.assignments
      .filter(
        (assignment) =>
          assignment.enabled !== false && assignment.inheritance_behavior !== "exclude"
      )
      .map((assignment) => assignment.component_pack_id)
  )
  const aliases = new Map<string, string[]>()
  for (const alias of input.aliases) {
    const owners = aliases.get(alias.normalized_alias) || []
    owners.push(alias.technology_concept_id)
    aliases.set(alias.normalized_alias, owners)
  }
  const conceptKeys = new Map<string, number>()
  for (const concept of input.concepts) {
    const key = concept.stable_key.trim().toLowerCase()
    conceptKeys.set(key, (conceptKeys.get(key) || 0) + 1)
  }

  return {
    properties_without_usage: input.properties
      .filter((property) => !usedProperties.has(property.id))
      .map((property) => property.key),
    compatibility_properties_without_mapping: input.properties
      .filter(
        (property) =>
          property.affects_compatibility &&
          !property.fact_path &&
          !property.validator_key
      )
      .map((property) => property.key),
    relation_types_without_validator: input.relation_types
      .filter((relation) => relation.status === "engine_mapped" && !relation.validator_key)
      .map((relation) => relation.key),
    relation_types_without_usage: input.relation_types
      .filter((relation) => !usedRelationTypes.has(relation.id))
      .map((relation) => relation.key),
    concepts_without_consumers_or_providers: input.concepts
      .filter((concept) => !relatedConcepts.has(concept.id))
      .map((concept) => concept.stable_key),
    packs_without_compatible_scope: input.packs
      .filter((pack) => !assignedPacks.has(pack.id))
      .map((pack) => pack.slug),
    duplicate_aliases: [...aliases]
      .filter(([, owners]) => new Set(owners).size > 1)
      .map(([alias]) => alias),
    duplicate_concepts: [...conceptKeys]
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
    scopes_with_unresolved_inherited_conflicts: input.assignments
      .filter(
        (assignment) =>
          (assignment.overrides_json?.unresolved_conflicts?.length || 0) > 0
      )
      .map((assignment) => `${assignment.scope_type}:${assignment.scope_id}`),
    deprecated_properties_still_used: input.properties
      .filter(
        (property) =>
          property.lifecycle_status === "deprecated" && usedProperties.has(property.id)
      )
      .map((property) => property.key),
  }
}

export function capabilityProfileErrors(profile: Record<string, unknown>) {
  const errors = CAPABILITY_SECTIONS
    .filter(
      (section) =>
        !profile[section] ||
        typeof profile[section] !== "object" ||
        Array.isArray(profile[section])
    )
    .map((section) => `Capability section must be an object: ${section}`)
  if (!Number.isInteger(profile.schema_version) || Number(profile.schema_version) < 1) {
    errors.push("Capability profile schema_version must be a positive integer.")
  }
  return errors
}

export type StorageBayGroup = {
  count: number
  native_form_factor: string
  accepted_form_factors: string[]
  adapter_required_for_json?: Record<string, string>
  numbering_start: number
  numbering_end: number
}

export function storageCageErrors(groups: StorageBayGroup[]) {
  const errors: string[] = []
  groups.forEach((group, index) => {
    if (group.count < 1) errors.push(`Bay group ${index} must contain at least one bay.`)
    if (!group.accepted_form_factors.includes(group.native_form_factor)) {
      errors.push(`Bay group ${index} must accept its native form factor.`)
    }
    if (group.numbering_end - group.numbering_start + 1 !== group.count) {
      errors.push(`Bay group ${index} numbering does not match count.`)
    }
    for (const accepted of group.accepted_form_factors) {
      if (
        accepted !== group.native_form_factor &&
        !group.adapter_required_for_json?.[accepted]
      ) {
        errors.push(`Bay group ${index} requires an adapter for ${accepted}.`)
      }
    }
  })
  return errors
}

export function optionGroupErrors(group: Record<string, unknown>) {
  const errors: string[] = []
  if (group.none_selected_by_default === true && group.allow_none !== true) {
    errors.push("none_selected_by_default requires allow_none.")
  }
  if (group.allow_none === true && !String(group.none_label || "").trim()) {
    errors.push("allow_none requires a none_label.")
  }
  if (Number(group.min_quantity || 0) > Number(group.max_quantity || 0)) {
    errors.push("min_quantity cannot exceed max_quantity.")
  }
  return errors
}

export type ServerModelPackAssignmentContract = InheritedAssignment & {
  scope_type: "server_model"
}

export type AttributeDefinitionContract = PropertyDefinitionContract
