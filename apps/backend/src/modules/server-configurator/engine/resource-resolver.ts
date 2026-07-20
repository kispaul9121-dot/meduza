import { CompatibilityData, TraceEntry, ValidationIssue } from "./types"
import { array, number, unique } from "./utils"

function quantities(value: any): Record<string, number> {
  if (!value) return {}
  if (Array.isArray(value)) return Object.fromEntries(value.map((item) => [typeof item === "string" ? item : item.key || item.resource, number(item.quantity, 1)]).filter(([key]) => key))
  return Object.fromEntries(Object.entries(value).map(([key, amount]) => [key, typeof amount === "object" ? number((amount as any).quantity, 1) : number(amount, 1)]))
}

function add(target: Record<string, number>, source: Record<string, number>, multiplier = 1) {
  for (const [key, amount] of Object.entries(source)) target[key] = number(target[key]) + amount * multiplier
}

export function resolveResources(data: CompatibilityData, selected: any[]) {
  const provided = quantities(data.model?.provides_json || data.model?.resources_json)
  const consumed: Record<string, number> = {}
  const issues: ValidationIssue[] = []
  const trace: TraceEntry[] = []
  const selectedIds = new Set(selected.map((item) => item.id))
  const assignments = new Map((data.direct_assignments || []).map((item: any) => [item.component_id, item]))
  const replaced = new Set<string>()

  for (const component of selected) {
    const assignment = assignments.get(component.id) as any
    const multiplier = number(component.quantity, 1)
    add(provided, quantities(assignment?.provides_override_json || component.provides_json || component.normalized_specs_json?.provides), multiplier)
    add(consumed, quantities(assignment?.consumes_override_json || component.consumes_json || component.normalized_specs_json?.consumes), multiplier)
    for (const id of array<string>(assignment?.requirements_override_json?.replaces_component_ids || component.requirements_json?.replaces_component_ids)) replaced.add(id)
    const conflicts = array<string>(assignment?.conflicts_override_json?.component_ids || component.conflicts_json?.component_ids || component.requirements_json?.conflicts_with)
    for (const conflictId of conflicts) {
      if (!selectedIds.has(conflictId)) continue
      issues.push({ code: "RESOURCE_COMPONENT_CONFLICT", message: `${component.public_name || component.id} conflicts with selected component ${conflictId}.`, severity: "blocker", validator: "resource_resolver", component_id: component.id })
    }
  }
  for (const [resource, demand] of Object.entries(consumed)) {
    const supply = number(provided[resource])
    if (demand > supply) issues.push({ code: "RESOURCE_CAPACITY_EXCEEDED", message: `Resource ${resource} demand ${demand} exceeds supply ${supply}.`, severity: "blocker", validator: "resource_resolver", details: { resource, demand, supply } })
    trace.push({ phase: "validator", validator: "resource_resolver", result: demand <= supply ? "pass" : "fail", reason_code: demand <= supply ? "RESOURCE_AVAILABLE" : "RESOURCE_CAPACITY_EXCEEDED", message: `Resource ${resource}: ${demand}/${supply}.`, details: { resource, demand, supply } })
  }
  return {
    issues,
    trace,
    effective: { provided, consumed, remaining: Object.fromEntries(unique([...Object.keys(provided), ...Object.keys(consumed)]).map((key) => [key, number(provided[key]) - number(consumed[key])])), replaced_components: [...replaced] },
  }
}

