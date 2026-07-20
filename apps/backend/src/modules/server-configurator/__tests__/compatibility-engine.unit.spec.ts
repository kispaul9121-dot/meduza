import { buildOptionResponse, validateCompatibility } from "../engine"
import { CompatibilityData } from "../engine/types"

function component(id: string, type: string, values: Record<string, unknown> = {}) {
  return { id, type, enabled: true, public_name: id, short_name: id, model: id, brand: "Test", price: 10, specs_json: values }
}

function base(overrides: Partial<CompatibilityData> = {}): CompatibilityData {
  return {
    model: {
      id: "server-1", slug: "server-1", brand: "Test", family: "F", generation: "G", chassis_type: "rack",
      cpu_socket: "LGA", max_cpu: 2, ram_slots_per_cpu: 4, ram_slots_total: 8, max_ram_capacity_gb: 512,
      supported_ram_types: ["RDIMM"], max_memory_speed: 3200, drive_bays_front: 4, drive_bays_rear: 2,
      drive_form_factor: "2.5", supported_drive_interfaces: ["SAS", "SATA", "NVMe"], pcie_slots: 4,
      pcie_lanes: 64, network_mezzanine_slots: 1, cooling_capacity_watts: 600,
    },
    components: [], selected: [], rules: [], scope_chain: [{ type: "global", id: "global" }, { type: "server_model", id: "server-1" }],
    ...overrides,
  }
}

describe("universal compatibility engine", () => {
  it("is deterministic and idempotent for the same normalized input", () => {
    const data = base({
      components: [component("cpu", "cpu", { socket: "LGA", max_memory_speed: 2933, tdp: 120 }), component("ram", "ram", { type: "RDIMM", speed: 3200, capacity_gb: 32 })],
      selected: [{ component_id: "cpu", quantity: 2 }, { component_id: "ram", quantity: 4 }],
    })
    expect(validateCompatibility(data)).toEqual(validateCompatibility(data))
    expect(validateCompatibility(data).effective_specs.ram_speed).toBe(2933)
    expect(validateCompatibility(data).effective_specs.memory_slots).toBe(8)
  })

  it("places mixed drives across multiple zones and returns a bay trace", () => {
    const data = base({
      components: [component("sas", "drive", { interface: "SAS", form_factor: "2.5" }), component("nvme", "drive", { interface: "NVMe", form_factor: "2.5" })],
      selected: [{ component_id: "sas", quantity: 2 }, { component_id: "nvme", quantity: 2 }],
      storage_topologies: [{ id: "topology", zones_json: [
        { id: "sas-zone", capacity: 2, protocols: ["SAS", "SATA"], form_factors: ["2.5"] },
        { id: "nvme-zone", capacity: 2, protocols: ["NVMe"], form_factors: ["2.5"] },
      ] }],
    })
    const result = validateCompatibility(data)
    expect(result.valid).toBe(true)
    expect(result.placements).toHaveLength(4)
    expect(result.placements.map((item) => item.zone_id)).toEqual(["sas-zone", "sas-zone", "nvme-zone", "nvme-zone"])
  })

  it("requires an approved adapter for accepted non-native form factors", () => {
    const data = base({
      components: [component("sff", "drive", { interface: "SAS", form_factor: "2.5" })],
      selected: [{ component_id: "sff" }],
      storage_topologies: [{ id: "lff", zones_json: [{ id: "lff-zone", capacity: 1, protocols: ["SAS"], form_factors: ["3.5"], accepted_form_factors: ["2.5"], adapters: { "2.5": "adapter-sff-lff" } }] }],
    })
    const result = validateCompatibility(data)
    expect(result.placements[0]).toMatchObject({ result: "placed", adapter_required: "adapter-sff-lff", reason_code: "STORAGE_PLACED_WITH_ADAPTER" })
  })

  it("deduplicates a candidate contributed by pack and direct assignment", () => {
    const data = base({
      components: [component("cpu", "cpu", { socket: "LGA" })],
      packs: [{ id: "pack", enabled: true }], pack_items: [{ id: "item", component_pack_id: "pack", component_id: "cpu", enabled: true }],
      pack_assignments: [{ id: "pa", scope_type: "server_model", scope_id: "server-1", component_pack_id: "pack", enabled: true, inheritance_behavior: "inherit" }],
      direct_assignments: [{ id: "direct", server_model_id: "server-1", component_id: "cpu", enabled: true, assignment_role: "optional_choice", selection_mode: "visible", max_quantity: 2 }],
    })
    const response = buildOptionResponse(data)
    expect(response.options).toHaveLength(1)
    expect(response.options[0].source_types).toEqual(["pack", "direct"])
    expect(response.candidate_trace[0].reason_code).toBe("CANDIDATE_DEDUPLICATED")
  })

  it("validates explicit none and group cardinality", () => {
    const result = validateCompatibility(base({ option_groups: [{ key: "gpu", component_type: "accelerator", selection_cardinality: "exactly_one", allow_none: false, min_quantity: 1, max_quantity: 1, enabled: true }] }))
    expect(result.reason_codes).toContain("OPTION_GROUP_SELECTION_REQUIRED")
  })

  it("checks GPU enablement and boot RAID1 without vendor-specific code", () => {
    const data = base({
      components: [component("gpu", "accelerator", { qualification: "vendor_qualified", required_fan_kit: "fan", required_riser: "riser", pcie_lanes: 16 }), component("boot", "boot_storage", { raid1_required: true })],
      selected: [{ component_id: "gpu" }, { component_id: "boot" }],
    })
    const result = validateCompatibility(data)
    expect(result.reason_codes).toEqual(expect.arrayContaining(["ACCELERATOR_FAN_KIT_REQUIRED", "ACCELERATOR_RISER_REQUIRED", "BOOT_RAID1_PAIR_REQUIRED"]))
    expect(result.effective_specs["accelerator.gpu.qualification"]).toBe("vendor_qualified")
  })

  it("blocks duplicate invalid quantities, unknown validators and unmapped compatibility data", () => {
    const data = base({
      components: [component("cpu", "cpu", { socket: "LGA" })], selected: [{ component_id: "cpu", quantity: 0 }, { component_id: "cpu", quantity: 1 }],
      component_type_definitions: [{ enabled: true, compatibility_mode: "validated", validator_key: "user_supplied_javascript" }],
      property_definitions: [{ id: "pd", key: "new.fact", affects_compatibility: true, usage_status: "unmapped", schema_version: 1 }],
      property_assignments: [{ id: "pa", owner_type: "server_model", owner_id: "server-1", property_definition_id: "pd", assignment_mode: "direct", value_json: 1, enabled: true }],
      relation_type_definitions: [{ id: "rt", key: "mystery", status: "unmapped" }],
      relations: [{ id: "rel", source_type: "component", source_id: "cpu", relation_type_id: "rt", target_type: "socket", target_id: "LGA", enabled: true }],
    })
    const result = validateCompatibility(data)
    expect(result.reason_codes).toEqual(expect.arrayContaining(["INVALID_COMPONENT_QUANTITY", "DUPLICATE_COMPONENT_ID", "VALIDATOR_KEY_UNKNOWN", "COMPATIBILITY_PROPERTY_UNMAPPED", "RELATION_UNMAPPED"]))
    expect(result.valid).toBe(false)
  })

  it("resolves property inheritance broad-to-narrow and blocks equal-priority conflicts", () => {
    const common = {
      property_definitions: [{ id: "pd", key: "memory.limit", affects_compatibility: true, usage_status: "engine_mapped", schema_version: 2 }],
      scope_chain: [{ type: "global", id: "global" }, { type: "technology_platform", id: "platform" }, { type: "server_model", id: "server-1" }],
    }
    const resolved = validateCompatibility(base({ ...common, property_assignments: [
      { id: "global", owner_type: "global", owner_id: "global", property_definition_id: "pd", assignment_mode: "direct", value_json: 128, enabled: true },
      { id: "model", owner_type: "server_model", owner_id: "server-1", property_definition_id: "pd", assignment_mode: "override", value_json: 512, enabled: true },
    ] }))
    expect(resolved.resolved_properties[0]).toMatchObject({ value: 512, source_scope: "server_model", schema_version: 2, conflict: false })
    const conflict = validateCompatibility(base({ ...common, property_assignments: [
      { id: "a", owner_type: "server_model", owner_id: "server-1", property_definition_id: "pd", assignment_mode: "direct", value_json: 256, enabled: true },
      { id: "b", owner_type: "server_model", owner_id: "server-1", property_definition_id: "pd", assignment_mode: "direct", value_json: 512, enabled: true },
    ] }))
    expect(conflict.reason_codes).toContain("PROPERTY_PRIORITY_CONFLICT")
  })

  it("validates mapped relation quantities and reports the provider trace", () => {
    const data = base({
      components: [component("consumer", "nic"), component("provider", "riser")], selected: [{ component_id: "consumer" }, { component_id: "provider" }],
      relation_type_definitions: [
        { id: "requires", key: "requires", status: "engine_mapped", engine_mapping: "requires", inverse_relation_key: "provides", validator_key: "expansion" },
        { id: "provides", key: "provides", status: "engine_mapped", engine_mapping: "provides", validator_key: "expansion" },
      ],
      relations: [
        { id: "need", source_type: "component", source_id: "consumer", relation_type_id: "requires", target_type: "resource", target_id: "slot", quantity: 1, enabled: true },
        { id: "supply", source_type: "component", source_id: "provider", relation_type_id: "provides", target_type: "resource", target_id: "slot", quantity: 1, enabled: true },
      ],
    })
    const result = validateCompatibility(data)
    expect(result.relation_summary).toMatchObject({ mapped: 2, passed: 2, failed: 0 })
    expect(result.trace).toEqual(expect.arrayContaining([expect.objectContaining({ phase: "relation", reason_code: "RELATION_PROVIDER_FOUND", details: expect.objectContaining({ provider_relation: "supply" }) })]))
  })

  it("resolves enablement resources and replacement metadata generically", () => {
    const data = base({
      model: { ...base().model, provides_json: { pcie_slot: 1 } },
      components: [
        { ...component("kit", "riser"), provides_json: { pcie_slot: 2 }, requirements_json: { replaces_component_ids: ["built-in-riser"] } },
        { ...component("gpu", "accelerator"), consumes_json: { pcie_slot: 2 } },
      ],
      selected: [{ component_id: "kit" }, { component_id: "gpu" }],
    })
    const result = validateCompatibility(data)
    expect(result.reason_codes).not.toContain("RESOURCE_CAPACITY_EXCEEDED")
    expect(result.effective_specs.resources).toMatchObject({ provided: { pcie_slot: 3 }, consumed: { pcie_slot: 2 }, remaining: { pcie_slot: 1 }, replaced_components: ["built-in-riser"] })
  })

  it("builds 500 explainable options without quadratic candidate resolution", () => {
    const components = Array.from({ length: 500 }, (_, index) => component(`service-${index}`, "service"))
    const started = Date.now()
    const response = buildOptionResponse(base({ components }))
    expect(response.options).toHaveLength(500)
    expect(Date.now() - started).toBeLessThan(2000)
  })
})
