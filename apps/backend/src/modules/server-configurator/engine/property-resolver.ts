import { CompatibilityData, ResolvedProperty, TraceEntry, ValidationIssue } from "./types"

const SCOPE_ORDER = [
  "global",
  "technology_platform",
  "vendor_generation",
  "server_family",
  "server_model",
  "chassis_variant",
  "storage_option",
]

function valueKey(value: unknown) {
  return JSON.stringify(value, Object.keys((value && typeof value === "object" ? value : {}) as object).sort())
}

export function resolveProperties(data: CompatibilityData): {
  properties: ResolvedProperty[]
  issues: ValidationIssue[]
  trace: TraceEntry[]
} {
  const definitions = new Map((data.property_definitions || []).map((item: any) => [item.id, item]))
  const scopes = new Map((data.scope_chain || []).map((scope) => [`${scope.type}:${scope.id}`, SCOPE_ORDER.indexOf(scope.type)]))
  const assignments = (data.property_assignments || [])
    .filter((item: any) => item.enabled !== false && scopes.has(`${item.owner_type}:${item.owner_id}`))
    .sort((a: any, b: any) => {
      const priority = (scopes.get(`${a.owner_type}:${a.owner_id}`) || 0) - (scopes.get(`${b.owner_type}:${b.owner_id}`) || 0)
      return priority || String(a.id).localeCompare(String(b.id))
    })
  const grouped = new Map<string, any[]>()
  const issues: ValidationIssue[] = []
  const trace: TraceEntry[] = []

  for (const assignment of assignments) {
    const definition = definitions.get(assignment.property_definition_id) as any
    if (!definition) {
      issues.push({
        code: "PROPERTY_DEFINITION_MISSING",
        message: `Property assignment ${assignment.id} has no canonical definition.`,
        severity: "blocker",
        validator: "property_resolver",
        path: `property_assignments.${assignment.id}`,
      })
      continue
    }
    const bucket = grouped.get(definition.key) || []
    bucket.push({ assignment, definition, priority: scopes.get(`${assignment.owner_type}:${assignment.owner_id}`) || 0 })
    grouped.set(definition.key, bucket)
  }

  const properties: ResolvedProperty[] = []
  for (const [key, entries] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const highest = Math.max(...entries.map((entry) => entry.priority))
    const winners = entries.filter((entry) => entry.priority === highest && entry.assignment.assignment_mode !== "disable")
    const distinct = new Set(winners.map((entry) => valueKey(entry.assignment.value_json)))
    const conflict = distinct.size > 1
    const chosen = winners[0] || entries[entries.length - 1]
    const excluded = entries.some((entry) => entry.priority === highest && entry.assignment.assignment_mode === "disable")
    const property: ResolvedProperty = {
      key,
      value: excluded ? undefined : chosen?.assignment.value_json,
      source_scope: chosen?.assignment.owner_type || "global",
      source_id: chosen?.assignment.owner_id || "global",
      schema_version: Number(chosen?.definition.schema_version || 1),
      inheritance_chain: entries.map((entry) => ({
        scope: entry.assignment.owner_type,
        id: entry.assignment.owner_id,
        value: entry.assignment.value_json,
        mode: entry.assignment.assignment_mode,
      })),
      excluded,
      conflict,
    }
    properties.push(property)
    trace.push({
      phase: "property",
      validator: "property_resolver",
      result: conflict ? "unresolved" : "applied",
      reason_code: conflict ? "PROPERTY_PRIORITY_CONFLICT" : excluded ? "PROPERTY_EXCLUDED" : "PROPERTY_RESOLVED",
      message: conflict ? `Property ${key} has conflicting values at the same scope.` : `Resolved property ${key}.`,
      details: { source_scope: property.source_scope, source_id: property.source_id, chain_length: entries.length },
    })
    if (conflict) {
      issues.push({ code: "PROPERTY_PRIORITY_CONFLICT", message: `Property ${key} has conflicting values at equal priority.`, severity: "blocker", validator: "property_resolver", path: key })
    }
    const definition = chosen?.definition
    if (definition?.affects_compatibility && ["unmapped", "unmapped_compatibility_property"].includes(definition.usage_status)) {
      issues.push({ code: "COMPATIBILITY_PROPERTY_UNMAPPED", message: `Compatibility property ${key} has no engine mapping.`, severity: "blocker", validator: "property_resolver", path: key })
    }
  }

  return { properties, issues, trace }
}

