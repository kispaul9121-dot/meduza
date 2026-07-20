import { resolveCandidates } from "./candidate-resolver"
import { buildFacts, selectedComponents } from "./facts"
import { resolveProperties } from "./property-resolver"
import { resolveRelations } from "./relation-resolver"
import { applyRules } from "./rules"
import { resolveResources } from "./resource-resolver"
import {
  CandidateOption,
  CompatibilityData,
  CompatibilityResult,
  TraceEntry,
  ValidationIssue,
  ValidationMode,
} from "./types"
import { issueTrace, number, unique } from "./utils"
import { runValidators } from "./validators"

function validateGroups(data: CompatibilityData, selected: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const explicitNone = new Set(data.explicit_none || [])
  for (const group of (data.option_groups || []).filter((item: any) => item.enabled !== false)) {
    const chosen = selected.filter((component) => component.type === group.component_type)
      .reduce((sum, component) => sum + number(component.quantity, 1), 0)
    if (explicitNone.has(group.key) && chosen > 0) issues.push({ code: "OPTION_GROUP_NONE_CONFLICT", message: `Group ${group.key} records both explicit none and selected components.`, severity: "blocker", validator: "option_groups", group_key: group.key })
    if (explicitNone.has(group.key) && !group.allow_none) issues.push({ code: "OPTION_GROUP_NONE_NOT_ALLOWED", message: `Group ${group.key} does not allow none.`, severity: "blocker", validator: "option_groups", group_key: group.key })
    if (["exactly_one", "one_or_many"].includes(group.selection_cardinality) && chosen === 0 && !explicitNone.has(group.key)) issues.push({ code: "OPTION_GROUP_SELECTION_REQUIRED", message: `Group ${group.key} requires a selection.`, severity: "blocker", validator: "option_groups", group_key: group.key })
    if (["zero_or_one", "exactly_one"].includes(group.selection_cardinality) && chosen > 1) issues.push({ code: "OPTION_GROUP_CARDINALITY_EXCEEDED", message: `Group ${group.key} allows at most one selection.`, severity: "blocker", validator: "option_groups", group_key: group.key })
    if (chosen < number(group.min_quantity) && !explicitNone.has(group.key)) issues.push({ code: "OPTION_GROUP_MIN_QUANTITY", message: `Group ${group.key} requires at least ${group.min_quantity}.`, severity: "blocker", validator: "option_groups", group_key: group.key })
    if (chosen > number(group.max_quantity, Number.MAX_SAFE_INTEGER)) issues.push({ code: "OPTION_GROUP_MAX_QUANTITY", message: `Group ${group.key} allows at most ${group.max_quantity}.`, severity: "blocker", validator: "option_groups", group_key: group.key })
  }
  return issues
}

function recommendations(issues: ValidationIssue[]) {
  const actions: Record<string, string> = {
    PROPERTY_DEFINITION_MISSING: "create_property_definition",
    COMPATIBILITY_PROPERTY_UNMAPPED: "assign_validator",
    RELATION_UNMAPPED: "map_relation_type",
    RELATION_PROVIDER_MISSING: "add_relation",
    VALIDATOR_KEY_UNKNOWN: "assign_validator",
    PROPERTY_PRIORITY_CONFLICT: "exclude_inherited_pack",
    STORAGE_ZONE_UNAVAILABLE: "choose_compatible_storage_option",
  }
  return issues.map((issue) => ({
    code: `REPAIR_${issue.code}`,
    message: `Repair suggestion for ${issue.code}: ${issue.message}`,
    action: actions[issue.code] || "review_compatibility_data",
    payload: issue.path ? { path: issue.path } : undefined,
  }))
}

export function validateCompatibility(data: CompatibilityData): CompatibilityResult {
  const mode: ValidationMode = data.mode || "production_validation"
  const issues: ValidationIssue[] = []
  const trace: TraceEntry[] = []
  const placements: CompatibilityResult["placements"] = []
  const propertyResolution = resolveProperties(data)
  issues.push(...propertyResolution.issues)
  trace.push(...propertyResolution.trace)

  if (!data.model) issues.push({ code: "SERVER_MODEL_NOT_FOUND", message: "Server model is required for compatibility validation.", severity: "blocker", validator: "model_guard" })
  if (data.partial) issues.push({ code: "PARTIAL_GRAPH_UNRESOLVED", message: "The draft compatibility graph is incomplete and cannot be considered compatible.", severity: "blocker", validator: "model_guard" })
  const selected = selectedComponents(data)
  for (const id of selected.missingIds) issues.push({ code: "COMPONENT_NOT_FOUND", message: `Component ${id} was not found.`, severity: "blocker", validator: "input", component_id: id })
  for (const id of selected.duplicateIds) issues.push({ code: "DUPLICATE_COMPONENT_ID", message: `Component ${id} occurs more than once; quantities were merged deterministically.`, severity: "warning", validator: "input", component_id: id })
  for (const id of selected.invalidQuantities) issues.push({ code: "INVALID_COMPONENT_QUANTITY", message: `Component ${id} has a non-positive or non-integer quantity.`, severity: "blocker", validator: "input", component_id: id })

  const candidates = data.resolved_candidates ? { options: data.resolved_candidates, trace: [] } : resolveCandidates(data)
  trace.push(...candidates.trace)
  const autoTechnical = candidates.options.filter((option) => option.assignment_roles.includes("auto_added_technical")).map((option) => option.component_id)
  const selectedIds = new Set(selected.components.map((component) => component.id))
  const selectedWithAuto = [...selected.components, ...autoTechnical.filter((id) => !selectedIds.has(id)).flatMap((id) => {
    const component = data.components.find((item) => item.id === id)
    return component ? [{ ...component, quantity: 1, auto_added: true }] : []
  })]
  const facts = buildFacts(data, selectedWithAuto, propertyResolution.properties)
  const effective: Record<string, unknown> = {}
  const byType = selectedWithAuto.reduce<Record<string, any[]>>((result, component) => {
    ;(result[component.type] ||= []).push(component)
    return result
  }, {})
  const addIssue = (issue: ValidationIssue) => {
    issues.push(issue)
    trace.push(issueTrace(issue))
  }
  runValidators({ data, selectedComponents: selectedWithAuto, byType, facts, effective, addIssue, addTrace: (entry) => trace.push(entry), placements })

  const resources = resolveResources(data, selectedWithAuto)
  for (const issue of resources.issues) addIssue(issue)
  trace.push(...resources.trace)
  effective.resources = resources.effective

  for (const issue of validateGroups(data, selectedWithAuto)) addIssue(issue)
  const relationResolution = resolveRelations(data, selectedWithAuto)
  issues.push(...relationResolution.issues)
  trace.push(...relationResolution.trace)
  const initialPrice = selectedWithAuto.reduce((sum, component) => sum + number(component.price) * number(component.quantity, 1), 0)
  const ruleResult = applyRules(data, facts, effective, initialPrice)
  issues.push(...ruleResult.issues)
  trace.push(...ruleResult.trace)
  const allAuto = unique([...autoTechnical, ...ruleResult.autoAdded])
  for (const required of ruleResult.required) {
    const satisfied = selectedWithAuto.some((component) => component.id === required || component.type === required)
    if (!satisfied) addIssue({ code: "REQUIRED_COMPONENT_MISSING", message: `Required component or type ${required} is not selected.`, severity: "blocker", validator: "rules" })
  }

  const unresolvedCodes = new Set(["PROPERTY_DEFINITION_MISSING", "COMPATIBILITY_PROPERTY_UNMAPPED", "RELATION_UNMAPPED", "VALIDATOR_KEY_UNKNOWN", "PROPERTY_PRIORITY_CONFLICT"])
  const hasUnresolved = issues.some((issue) => unresolvedCodes.has(issue.code)) || Boolean(data.partial)
  const blockers = issues.filter((issue) => issue.severity === "blocker")
  const status = blockers.length ? (hasUnresolved && mode !== "production_validation" ? "unresolved" : "incompatible") : hasUnresolved ? "unresolved" : "compatible"
  const visibleIssues = mode === "guided_check" ? issues.slice(0, 1) : issues
  const result: CompatibilityResult = {
    valid: status === "compatible",
    status,
    mode,
    errors: visibleIssues.filter((issue) => issue.severity === "blocker").map((issue) => issue.message),
    warnings: visibleIssues.filter((issue) => issue.severity !== "blocker").map((issue) => issue.message),
    issues: visibleIssues,
    reason_codes: unique(visibleIssues.map((issue) => issue.code)),
    required_components: ruleResult.required,
    auto_added_components: allAuto,
    effective_specs: effective,
    total_price: ruleResult.totalPrice,
    triggered_rules: ruleResult.triggered,
    facts,
    trace,
    placements,
    resolved_properties: propertyResolution.properties,
    relation_summary: relationResolution.summary,
    snapshot: {
      selected_components: data.selected.map((item) => ({ ...item, quantity: item.quantity || 1 })),
      explicit_none: unique(data.explicit_none || []),
      auto_added_components: allAuto,
      validation_trace: trace,
    },
    recommendations: recommendations(issues),
  }
  return result
}

export function buildOptionResponse(data: CompatibilityData) {
  const resolved = resolveCandidates(data)
  const options = resolved.options.map((candidate: CandidateOption) => {
    const alreadySelected = data.selected.some((item) => item.component_id === candidate.component_id)
    const validation = validateCompatibility({
      ...data,
      mode: "assisted_preview",
      resolved_candidates: resolved.options,
      selected: alreadySelected ? data.selected : [...data.selected, { component_id: candidate.component_id, quantity: Math.max(1, candidate.default_quantity) }],
    })
    const componentIssues = validation.issues.filter((issue) => !issue.component_id || issue.component_id === candidate.component_id)
    const placementCodes = validation.placements.filter((placement) => placement.component_id === candidate.component_id).map((placement) => placement.reason_code)
    const groupLimit = (data.option_groups || []).filter((group: any) => group.component_type === candidate.component.type).reduce((max: number, group: any) => Math.max(max, number(group.max_quantity, 1)), 1)
    const storageLimit = candidate.component.type === "drive"
      ? (validation.effective_specs.storage_zones as any[] || []).reduce((sum: number, zone: any) => sum + number(zone.capacity), 0)
      : 1
    const maxQuantity = candidate.source_types.includes("direct") ? candidate.max_quantity : Math.max(candidate.max_quantity, groupLimit, storageLimit)
    return {
      ...candidate.component,
      source_type: candidate.source_type,
      source_types: candidate.source_types,
      source_ids: candidate.source_ids,
      assignment_roles: candidate.assignment_roles,
      available: componentIssues.every((issue) => issue.severity !== "blocker"),
      disabled: componentIssues.some((issue) => issue.severity === "blocker"),
      reason_codes: unique([...componentIssues.map((issue) => issue.code), ...placementCodes]),
      message: componentIssues[0]?.message || null,
      max_quantity: maxQuantity,
      effective_specs: validation.effective_specs,
      required_bundles: candidate.required_bundles,
      conflicts: componentIssues.filter((issue) => issue.code.includes("CONFLICT")).map((issue) => issue.code),
      qualification: candidate.component.normalized_specs_json?.qualification || candidate.component.specs_json?.qualification || "technically_compatible",
      triggered_rules: validation.triggered_rules,
    }
  })
  const drive_suggestions = options.filter((option: any) => option.type === "drive").map((option: any) => ({
    component_id: option.id,
    status: option.disabled ? "incompatible" : option.reason_codes.includes("STORAGE_PLACED_WITH_ADAPTER") ? "compatible_with_adapter" : option.qualification === "vendor_qualified" ? "compatible" : "technically_compatible",
    reason_codes: option.reason_codes,
    max_quantity: option.max_quantity,
  }))
  return { options, drive_suggestions, candidate_trace: resolved.trace }
}
