import {
  buildReadyConfigurationSnapshot,
  pricePublicationErrors,
  readyDependencyFingerprints,
  stableHash,
  staleReasons,
} from "../ready-configurations"

function fixture() {
  const component = {
    id: "cmp_cpu_1",
    type: "cpu",
    public_name: "CPU 1",
    part_number: "PN-1",
    schema_version: 2,
    normalized_specs_json: { cores: 16 },
    enabled: true,
    stock_qty: 4,
    price: 120,
    medusa_product_variant_id: "variant_cpu_1",
  }
  const data: any = {
    model: { id: "model_1", slug: "server-1", public_name: "Server 1", schema_version: 3, medusa_variant_id: "variant_server_1" },
    components: [component],
    property_definitions: [{ id: "prop_1", key: "cpu.cores", schema_version: 1, lifecycle_status: "active", usage_status: "active", validator_key: "cpu" }],
    property_assignments: [{ id: "pa_1", owner_type: "server_model", owner_id: "model_1", property_definition_id: "prop_1", assignment_mode: "direct", value_json: 16, enabled: true }],
    relations: [{ id: "rel_1", source_type: "component", source_id: "cmp_cpu_1", relation_type_id: "supports", target_type: "server_model", target_id: "model_1", enabled: true, schema_version: 1 }],
    concepts: [{ id: "concept_1", stable_key: "cpu-family", concept_type_id: "ct_1", schema_version: 1, lifecycle_status: "active" }],
    packs: [{ id: "pack_1", slug: "cpu-pack", schema_version: 1, enabled: true, pack_kind: "candidate_pool" }],
    pack_items: [{ id: "pi_1", component_pack_id: "pack_1", component_id: "cmp_cpu_1", enabled: true, sort_order: 10 }],
    pack_assignments: [{ id: "pas_1", scope_type: "server_model", scope_id: "model_1", component_pack_id: "pack_1", enabled: true, priority: 10, inheritance_behavior: "inherit" }],
  }
  const validation: any = {
    valid: true,
    status: "compatible",
    reason_codes: [],
    errors: [],
    warnings: [],
    trace: [{ phase: "validator", validator: "cpu", result: "pass", reason_code: "OK", message: "ok" }],
    placements: [],
    auto_added_components: [],
    effective_specs: { cpu: { cores: 16 } },
    resolved_properties: [{ key: "cpu.cores", value: 16, schema_version: 1 }],
  }
  return { data, validation, component }
}

describe("ReadyConfiguration immutable snapshot contract", () => {
  test("creates a deterministic version snapshot with cloneable configurator input", () => {
    const { data, validation } = fixture()
    const first = buildReadyConfigurationSnapshot({
      data,
      validation,
      selected_components: [{ component_id: "cmp_cpu_1", quantity: 2 }],
      price_mode: "fixed",
      currency_code: "RUB",
      base_price: 1000,
      components_price: 240,
      total_price: 1240,
    })
    const second = buildReadyConfigurationSnapshot({
      data,
      validation,
      selected_components: [{ component_id: "cmp_cpu_1", quantity: 2 }],
      price_mode: "fixed",
      currency_code: "RUB",
      base_price: 1000,
      components_price: 240,
      total_price: 1240,
    })
    expect(first.snapshot_hash).toBe(second.snapshot_hash)
    expect(first.snapshot.selected_components).toEqual(expect.arrayContaining([
      expect.objectContaining({ component_id: "cmp_cpu_1", quantity: 2, schema_version: 2 }),
    ]))
    expect(first.snapshot.validation.trace).toHaveLength(1)
  })

  test("freezes selected component values instead of retaining live object references", () => {
    const { data, validation, component } = fixture()
    const frozen = buildReadyConfigurationSnapshot({ data, validation, selected_components: [{ component_id: component.id }], price_mode: "request_quote" })
    component.normalized_specs_json.cores = 32
    expect(frozen.snapshot.selected_components[0].normalized_specs.cores).toBe(16)
  })

  test.each([
    ["property definition update", (data: any) => { data.property_definitions[0].schema_version = 2 }, "PROPERTY_SCHEMA_CHANGED"],
    ["relation update", (data: any) => { data.relations[0].quantity = 2 }, "RELATION_GRAPH_CHANGED"],
    ["pack assignment update", (data: any) => { data.pack_assignments[0].priority = 20 }, "PACK_ASSIGNMENT_CHANGED"],
    ["component price update", (data: any) => { data.components[0].price = 130 }, "COMPONENT_OR_MODEL_CHANGED"],
    ["component removal", (data: any) => { data.components = [] }, "COMPONENT_OR_MODEL_CHANGED"],
  ])("marks the published version stale after %s", (_label, mutate, expected) => {
    const { data } = fixture()
    const saved = readyDependencyFingerprints(data)
    mutate(data)
    expect(staleReasons(saved, readyDependencyFingerprints(data))).toContain(expected)
  })

  test("request-quote permits missing commerce while fixed publication blocks it", () => {
    const selected = [{ component_id: "cmp_1", medusa_product_variant_id: null }]
    expect(pricePublicationErrors({ price_mode: "request_quote", selected_components: selected })).toEqual([])
    expect(pricePublicationErrors({ price_mode: "fixed", model: {}, selected_components: selected })).toEqual(expect.arrayContaining([
      "PRICE_CURRENCY_REQUIRED",
      "BASE_VARIANT_REQUIRED",
      "TOTAL_PRICE_REQUIRED",
      "COMPONENT_COMMERCE_LINK_REQUIRED:cmp_1",
    ]))
  })

  test("canonical hashing ignores object key order", () => {
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }))
  })
})
