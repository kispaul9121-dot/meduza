import { validateReadiness } from "../engine/readiness"
import { CompatibilityData } from "../engine/types"

const data: CompatibilityData = {
  model: { id: "server" }, components: [], selected: [], scope_chain: [{ type: "global", id: "global" }, { type: "server_model", id: "server" }],
  property_definitions: [{ id: "definition", key: "socket", value_type: "text", entity_scopes: ["server_model"], affects_compatibility: true }],
  property_assignments: [{ id: "assignment", owner_type: "server_model", owner_id: "server", property_definition_id: "definition", assignment_mode: "direct", value_json: "LGA", enabled: true }],
}

describe("readiness modes", () => {
  it("guided_check returns one next blocker and never marks partial drafts compatible", () => {
    const result = validateReadiness({ ...data, partial: true }, { mode: "guided_check" })
    expect(result.blockers).toHaveLength(1)
    expect(result.blockers[0].code).toBe("PARTIAL_GRAPH_UNRESOLVED")
    expect(result.compatible).toBe(false)
  })
  it("assisted_preview separates recommendations from deterministic results", () => {
    const result = validateReadiness(data, { mode: "assisted_preview" })
    expect(result.proposed_mappings).toEqual(expect.arrayContaining([expect.objectContaining({ action: "assign_validator" })]))
    expect(result.recommendations).toEqual(result.recommended_next_actions)
  })
  it("bulk_dry_run detects duplicate identities and remains idempotent on unique manifests", () => {
    const duplicate = validateReadiness(data, { mode: "bulk_dry_run", manifest: { planned_creates_json: [{ entity_type: "component", key: "x" }, { entity_type: "component", key: "x" }] } })
    expect(duplicate.blockers.map((item: any) => item.code)).toContain("MANIFEST_DUPLICATE_IDENTITY")
    expect(duplicate.idempotent).toBe(false)
    const unique = validateReadiness(data, { mode: "bulk_dry_run", manifest: { planned_creates_json: [{ entity_type: "component", key: "x" }] } })
    expect(unique.idempotent).toBe(true)
  })
  it("production validation blocks an unmapped compatibility property", () => {
    const result = validateReadiness(data, { mode: "production_validation" })
    expect(result.ready).toBe(false)
    expect(result.validator_gaps).toEqual(expect.arrayContaining([expect.objectContaining({ code: "PROPERTY_VALIDATOR_MISSING" })]))
  })
})
