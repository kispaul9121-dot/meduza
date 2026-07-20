import { CompatibilityData, TraceEntry, ValidationIssue } from "./types"
import { number } from "./utils"

export function resolveRelations(data: CompatibilityData, selectedComponents: any[]): {
  issues: ValidationIssue[]
  trace: TraceEntry[]
  summary: Record<string, number>
} {
  const definitions = new Map((data.relation_type_definitions || []).map((item: any) => [item.id, item]))
  const selectedIds = new Set([data.model?.id, ...selectedComponents.map((item) => item.id)])
  const relations = (data.relations || []).filter((relation: any) => relation.enabled !== false && selectedIds.has(relation.source_id))
  const issues: ValidationIssue[] = []
  const trace: TraceEntry[] = []
  const summary = { mapped: 0, passed: 0, failed: 0, unmapped: 0 }

  for (const relation of relations.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))) {
    const definition = definitions.get(relation.relation_type_id) as any
    if (!definition || definition.status !== "engine_mapped") {
      summary.unmapped += 1
      issues.push({
        code: "RELATION_UNMAPPED",
        message: `Relation ${relation.id} is compatibility evidence but its type is not engine-mapped.`,
        severity: "blocker",
        validator: "relation_resolver",
        component_id: relation.source_type === "component" ? relation.source_id : undefined,
        source_reference: relation.source_reference,
      })
      trace.push({ phase: "relation", validator: "relation_resolver", result: "unresolved", reason_code: "RELATION_UNMAPPED", message: `Skipped unmapped relation ${relation.id}.`, source_reference: relation.source_reference })
      continue
    }

    summary.mapped += 1
    const mapping = String(definition.engine_mapping || definition.key || "")
    let passed = true
    let code = "RELATION_SATISFIED"
    let provider: any
    if (mapping.includes("conflict")) {
      passed = !selectedIds.has(relation.target_id)
      code = passed ? "RELATION_CONFLICT_ABSENT" : "RELATION_CONFLICT_PRESENT"
    } else if (mapping.includes("require") || mapping.includes("consume")) {
      const inverse = definition.inverse_relation_key
      provider = (data.relations || []).find((candidate: any) => {
        const candidateDefinition = definitions.get(candidate.relation_type_id) as any
        const providerMapping = String(candidateDefinition?.engine_mapping || candidateDefinition?.key || "")
        return candidate.enabled !== false && selectedIds.has(candidate.source_id) &&
          (candidate.target_id === relation.target_id || candidate.target_id === relation.source_id) &&
          (candidateDefinition?.key === inverse || providerMapping.includes("provide") || providerMapping.includes("enable") || providerMapping.includes("convert")) &&
          number(candidate.quantity, 1) >= number(relation.quantity, 1)
      })
      passed = Boolean(provider || selectedIds.has(relation.target_id))
      code = passed ? "RELATION_PROVIDER_FOUND" : "RELATION_PROVIDER_MISSING"
    }

    if (passed) summary.passed += 1
    else {
      summary.failed += 1
      issues.push({
        code,
        message: `Mapped relation ${definition.key} is not satisfied for ${relation.source_id}.`,
        severity: "blocker",
        validator: definition.validator_key || "relation_resolver",
        component_id: relation.source_type === "component" ? relation.source_id : undefined,
        source_reference: relation.source_reference,
        details: { required_quantity: number(relation.quantity, 1), target_id: relation.target_id },
      })
    }
    trace.push({
      phase: "relation",
      validator: definition.validator_key || "relation_resolver",
      result: passed ? "pass" : "fail",
      reason_code: code,
      message: passed ? `Mapped relation ${definition.key} is satisfied.` : `No provider satisfies ${definition.key}.`,
      component_id: relation.source_type === "component" ? relation.source_id : undefined,
      source_reference: relation.source_reference,
      details: { required_relation: relation.id, provider_relation: provider?.id, required_quantity: number(relation.quantity, 1), provider_quantity: number(provider?.quantity, 0), conditions: relation.conditions_json },
    })
  }
  return { issues, trace, summary }
}

