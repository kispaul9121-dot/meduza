import { CandidateOption, CompatibilityData, OptionSourceType, TraceEntry } from "./types"
import { array, unique } from "./utils"
import { componentAppliesToModel } from "../applicability"

type Contribution = {
  component_id: string
  source_type: OptionSourceType
  source_id: string
  assignment_role?: string
  selection_mode?: string
  default_quantity?: number
  min_quantity?: number
  max_quantity?: number
  required_bundles?: string[]
}

function scopeKeys(data: CompatibilityData) {
  return new Set((data.scope_chain || []).map((scope) => `${scope.type}:${scope.id}`))
}

export function resolveCandidates(data: CompatibilityData): { options: CandidateOption[]; trace: TraceEntry[] } {
  const contributions: Contribution[] = []
  const scopes = scopeKeys(data)
  const activeAssignments = (data.pack_assignments || []).filter((assignment: any) =>
    assignment.enabled !== false && scopes.has(`${assignment.scope_type}:${assignment.scope_id}`)
  )
  const excludedPackIds = new Set(activeAssignments.filter((item: any) => item.inheritance_behavior === "exclude").map((item: any) => item.component_pack_id))
  const assignedPackIds = new Set(activeAssignments.filter((item: any) => item.inheritance_behavior !== "exclude").map((item: any) => item.component_pack_id))

  for (const item of data.pack_items || []) {
    if (item.enabled === false || !assignedPackIds.has(item.component_pack_id) || excludedPackIds.has(item.component_pack_id)) continue
    contributions.push({ component_id: item.component_id, source_type: "pack", source_id: item.component_pack_id })
  }
  for (const item of data.direct_assignments || []) {
    if (item.enabled === false || item.server_model_id !== data.model?.id) continue
    contributions.push({
      component_id: item.component_id,
      source_type: item.assignment_role === "auto_added_technical" ? "auto_added" : "direct",
      source_id: item.id,
      assignment_role: item.assignment_role,
      selection_mode: item.selection_mode,
      default_quantity: item.default_quantity,
      min_quantity: item.min_quantity,
      max_quantity: item.max_quantity,
    })
  }
  for (const topology of data.storage_topologies || []) {
    for (const componentId of array<string>(topology.provides_json?.component_ids || topology.requirements_json?.component_ids)) {
      contributions.push({ component_id: componentId, source_type: "topology", source_id: topology.id })
    }
  }
  for (const bundle of data.bundles || []) {
    for (const item of array<any>(bundle.components_json || bundle.items_json)) {
      const componentId = typeof item === "string" ? item : item.component_id
      if (componentId) contributions.push({ component_id: componentId, source_type: "bundle", source_id: bundle.id, required_bundles: [bundle.id] })
    }
  }
  for (const component of data.components || []) {
    if (component.specs_json?.built_in || component.normalized_specs_json?.built_in) {
      contributions.push({ component_id: component.id, source_type: "built_in", source_id: component.id, assignment_role: "default_component", default_quantity: 1 })
    }
  }
  // Legacy records predate PackAssignment. This bridge is deterministic and is
  // removed per-model as soon as any canonical assignment source exists.
  if (contributions.length === 0 && data.model) {
    for (const component of data.components || []) {
      if (component.enabled !== false && componentAppliesToModel(component, data.model)) {
        contributions.push({ component_id: component.id, source_type: "built_in", source_id: "legacy-applicability" })
      }
    }
  }

  const components = new Map((data.components || []).map((component: any) => [component.id, component]))
  const grouped = new Map<string, Contribution[]>()
  for (const contribution of contributions) grouped.set(contribution.component_id, [...(grouped.get(contribution.component_id) || []), contribution])
  const options: CandidateOption[] = []
  const trace: TraceEntry[] = []
  for (const [componentId, sources] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const component = components.get(componentId)
    if (!component || component.enabled === false) continue
    const sourceTypes = unique(sources.map((source) => source.source_type))
    options.push({
      component,
      component_id: componentId,
      source_type: sourceTypes[0],
      source_types: sourceTypes,
      source_ids: unique(sources.map((source) => source.source_id)),
      assignment_roles: unique(sources.map((source) => source.assignment_role).filter(Boolean) as string[]),
      default_quantity: Math.max(0, ...sources.map((source) => Number(source.default_quantity || 0))),
      min_quantity: Math.max(0, ...sources.map((source) => Number(source.min_quantity || 0))),
      max_quantity: Math.max(1, ...sources.map((source) => Number(source.max_quantity || 1))),
      selection_mode: sources.find((source) => source.selection_mode)?.selection_mode || "visible",
      required_bundles: unique(sources.flatMap((source) => source.required_bundles || [])),
    })
    trace.push({
      phase: "candidate",
      validator: "candidate_resolver",
      result: "applied",
      reason_code: sourceTypes.length > 1 ? "CANDIDATE_DEDUPLICATED" : "CANDIDATE_RESOLVED",
      message: `Candidate ${componentId} resolved from ${sourceTypes.join(", ")}.`,
      component_id: componentId,
      details: { source_types: sourceTypes, source_count: sources.length },
    })
  }
  return { options, trace }
}
