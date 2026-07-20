import { applyRules, evaluateCondition, RULE_OPERATORS } from "../engine/rules"
import { CompatibilityData } from "../engine/types"

const facts = { value: 5, list: ["a", "b"], present: "yes" }

describe("compatibility rule operators", () => {
  const cases: Array<[string, unknown, unknown, boolean]> = [
    ["equals", 5, 5, true], ["not_equals", 5, 6, true], ["greater_than", 5, 4, true],
    ["greater_than_or_equal", 5, 5, true], ["less_than", 5, 6, true], ["less_than_or_equal", 5, 5, true],
    ["includes", ["a"], "a", true], ["not_includes", ["a"], "b", true], ["in", "a", ["a"], true],
    ["not_in", "b", ["a"], true], ["exists", "x", null, true], ["not_exists", null, null, true],
  ]
  it.each(cases)("supports %s", (operator, left, right, expected) => expect(RULE_OPERATORS[operator](left, right)).toBe(expected))
  it("supports and/or/not composition and rejects unknown operators", () => {
    expect(evaluateCondition({ and: [{ fact: "value", operator: "greater_than", value: 1 }, { not: { fact: "list", operator: "includes", value: "z" } }] }, facts)).toEqual({ matched: true, unknownOperator: undefined })
    expect(evaluateCondition({ fact: "value", operator: "execute_js", value: 5 }, facts)).toEqual({ matched: false, unknownOperator: "execute_js" })
  })
})

describe("compatibility rule scopes and actions", () => {
  const model = { id: "m1", slug: "model", brand: "Brand", generation: "Gen", family: "Family", chassis_type: "Rack" }
  const base: CompatibilityData = { model, components: [], selected: [{ component_id: "c1" }], scope_chain: [] }
  const scopes = [
    ["global", null], ["brand", "Brand"], ["generation", "Gen"], ["family", "Family"],
    ["server_model", "model"], ["chassis_variant", "Rack"], ["component", "c1"],
  ]
  it.each(scopes)("matches %s scope", (scope_type, scope_value) => {
    const result = applyRules({ ...base, rules: [{ id: scope_type, enabled: true, priority: 1, scope_type, scope_value, rule_type: "warning", action_json: {}, message: scope_type }] }, facts, {}, 0)
    expect(result.triggered).toHaveLength(1)
  })
  it("applies require, auto-add, limits, effective values and pricing", () => {
    const rules = [
      { id: "require", enabled: true, priority: 1, scope_type: "global", rule_type: "require", action_json: { component_type: "psu" } },
      { id: "auto", enabled: true, priority: 2, scope_type: "global", rule_type: "auto_add", action_json: { component_id: "cable" } },
      { id: "limit", enabled: true, priority: 3, scope_type: "global", rule_type: "limit", action_json: { set_limit: { fact: "value", max: 4 } } },
      { id: "effective", enabled: true, priority: 4, scope_type: "global", rule_type: "downgrade", action_json: { set_effective_value: { field: "speed", value_from_fact: "value" } } },
      { id: "price", enabled: true, priority: 5, scope_type: "global", rule_type: "price_rule", action_json: { add_price: 10, multiply_price: 2 } },
    ]
    const effective: Record<string, unknown> = {}
    const result = applyRules({ ...base, rules }, facts, effective, 5)
    expect(result.required).toEqual(["psu"])
    expect(result.autoAdded).toEqual(["cable"])
    expect(result.totalPrice).toBe(30)
    expect(effective).toMatchObject({ value_max: 4, speed: 5 })
    expect(result.issues.map((item) => item.code)).toContain("RULE_LIMIT_EXCEEDED")
  })
  it("blocks unknown actions and executes block/warning actions", () => {
    const result = applyRules({ ...base, rules: [
      { id: "block", enabled: true, priority: 1, scope_type: "global", rule_type: "block", action_json: {} },
      { id: "warning", enabled: true, priority: 2, scope_type: "global", rule_type: "warning", action_json: { warning: "warn" } },
      { id: "unknown", enabled: true, priority: 3, scope_type: "global", rule_type: "allow", action_json: { eval: "bad" } },
    ] }, facts, {}, 0)
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining(["RULE_BLOCK", "RULE_WARNING", "RULE_ACTION_UNKNOWN"]))
  })
})

