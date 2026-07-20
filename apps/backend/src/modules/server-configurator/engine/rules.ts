import { CompatibilityData, TraceEntry, ValidationIssue } from "./types"
import { array, getPath, number, unique } from "./utils"

export const RULE_OPERATORS: Record<string, (left: unknown, right: unknown) => boolean> = {
  equals: (left, right) => left === right,
  not_equals: (left, right) => left !== right,
  greater_than: (left, right) => number(left) > number(right),
  greater_than_or_equal: (left, right) => number(left) >= number(right),
  less_than: (left, right) => number(left) < number(right),
  less_than_or_equal: (left, right) => number(left) <= number(right),
  includes: (left, right) => array(left).includes(right),
  not_includes: (left, right) => !array(left).includes(right),
  in: (left, right) => array(right).includes(left),
  not_in: (left, right) => !array(right).includes(left),
  exists: (left) => left !== undefined && left !== null && left !== "",
  not_exists: (left) => left === undefined || left === null || left === "",
}

export function evaluateCondition(condition: any, facts: Record<string, unknown>): { matched: boolean; unknownOperator?: string } {
  if (!condition) return { matched: true }
  if (Array.isArray(condition.and)) {
    const results = condition.and.map((item: any) => evaluateCondition(item, facts))
    return { matched: results.every((item: any) => item.matched), unknownOperator: results.find((item: any) => item.unknownOperator)?.unknownOperator }
  }
  if (Array.isArray(condition.or)) {
    const results = condition.or.map((item: any) => evaluateCondition(item, facts))
    return { matched: results.some((item: any) => item.matched), unknownOperator: results.find((item: any) => item.unknownOperator)?.unknownOperator }
  }
  if (condition.not) {
    const result = evaluateCondition(condition.not, facts)
    return { matched: !result.matched, unknownOperator: result.unknownOperator }
  }
  const operatorName = condition.operator || "equals"
  const operator = RULE_OPERATORS[operatorName]
  if (!operator) return { matched: false, unknownOperator: operatorName }
  return { matched: operator(getPath(facts, condition.fact), condition.value) }
}

function scopeMatches(rule: any, data: CompatibilityData, selectedIds: Set<string>) {
  const model = data.model || {}
  if (rule.scope_type === "global") return true
  if (rule.scope_type === "brand") return rule.scope_value === model.brand
  if (rule.scope_type === "generation") return rule.scope_value === model.generation
  if (rule.scope_type === "family") return rule.scope_value === model.family
  if (rule.scope_type === "server_model") return [model.id, model.slug].includes(rule.scope_value)
  if (rule.scope_type === "chassis_variant") return [model.chassis_variant_id, model.chassis_type].includes(rule.scope_value)
  if (rule.scope_type === "component") return selectedIds.has(rule.scope_value)
  return false
}

export function applyRules(
  data: CompatibilityData,
  facts: Record<string, unknown>,
  effective: Record<string, unknown>,
  initialPrice: number
): {
  issues: ValidationIssue[]
  trace: TraceEntry[]
  triggered: any[]
  required: string[]
  autoAdded: string[]
  totalPrice: number
} {
  const selectedIds = new Set(data.selected.map((item) => item.component_id))
  const issues: ValidationIssue[] = []
  const trace: TraceEntry[] = []
  const triggered: any[] = []
  const required: string[] = []
  const autoAdded: string[] = []
  let totalPrice = initialPrice
  const rules = (data.rules || []).filter((rule: any) => rule.enabled !== false && scopeMatches(rule, data, selectedIds))
    .sort((a: any, b: any) => number(a.priority, 100) - number(b.priority, 100) || String(a.id).localeCompare(String(b.id)))

  for (const rule of rules) {
    const evaluation = evaluateCondition(rule.conditions_json, facts)
    if (evaluation.unknownOperator) {
      issues.push({ code: "RULE_OPERATOR_UNKNOWN", message: `Rule ${rule.id} uses unknown operator ${evaluation.unknownOperator}.`, severity: "blocker", validator: "rules", source_reference: rule.source_doc_reference })
      trace.push({ phase: "rule", validator: "rules", result: "unresolved", reason_code: "RULE_OPERATOR_UNKNOWN", message: `Rule ${rule.id} was not executed.`, source_reference: rule.source_doc_reference })
      continue
    }
    if (!evaluation.matched) continue
    triggered.push({ id: rule.id, name: rule.name, scope_type: rule.scope_type, scope_value: rule.scope_value, source_doc_reference: rule.source_doc_reference })
    const action = rule.action_json || {}
    const recognized = new Set(["warning", "component_type", "component_id", "set_limit", "set_effective_value", "add_price", "multiply_price"])
    const unknown = Object.keys(action).filter((key) => !recognized.has(key))
    if (unknown.length) {
      issues.push({ code: "RULE_ACTION_UNKNOWN", message: `Rule ${rule.id} has unknown actions: ${unknown.join(", ")}.`, severity: "blocker", validator: "rules", source_reference: rule.source_doc_reference })
    }
    if (rule.rule_type === "block") issues.push({ code: "RULE_BLOCK", message: rule.message || "Configuration is blocked by a compatibility rule.", severity: "blocker", validator: "rules", source_reference: rule.source_doc_reference })
    if (rule.rule_type === "warning" || action.warning) issues.push({ code: "RULE_WARNING", message: rule.message || action.warning, severity: "warning", validator: "rules", source_reference: rule.source_doc_reference })
    if (rule.rule_type === "require") {
      const requiredKey = action.component_id || action.component_type
      if (requiredKey) required.push(requiredKey)
      else issues.push({ code: "RULE_REQUIRE_TARGET_MISSING", message: `Require rule ${rule.id} has no component target.`, severity: "blocker", validator: "rules" })
    }
    if (rule.rule_type === "auto_add") {
      const componentId = action.component_id || action.component_type
      if (componentId) autoAdded.push(componentId)
      else issues.push({ code: "RULE_AUTO_ADD_TARGET_MISSING", message: `Auto-add rule ${rule.id} has no component target.`, severity: "blocker", validator: "rules" })
    }
    if (action.set_limit?.fact && action.set_limit.max !== undefined) {
      effective[`${action.set_limit.fact}_max`] = action.set_limit.max
      if (number(getPath(facts, action.set_limit.fact)) > number(action.set_limit.max)) issues.push({ code: "RULE_LIMIT_EXCEEDED", message: rule.message || `${action.set_limit.fact} exceeds its maximum.`, severity: "blocker", validator: "rules" })
    }
    if (action.set_effective_value?.field) effective[action.set_effective_value.field] = action.set_effective_value.value_from_fact ? getPath(facts, action.set_effective_value.value_from_fact) : action.set_effective_value.value
    if (action.add_price !== undefined) totalPrice += number(action.add_price)
    if (action.multiply_price !== undefined) totalPrice *= number(action.multiply_price, 1)
    trace.push({ phase: "rule", validator: "rules", result: unknown.length ? "unresolved" : "applied", reason_code: unknown.length ? "RULE_ACTION_UNKNOWN" : "RULE_APPLIED", message: `Applied rule ${rule.name || rule.id}.`, source_reference: rule.source_doc_reference, details: { rule_type: rule.rule_type, action_keys: Object.keys(action) } })
  }
  return { issues, trace, triggered, required: unique(required), autoAdded: unique(autoAdded), totalPrice }
}

