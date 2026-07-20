import fs from "node:fs"
import path from "node:path"
import { CoreServerDraftSchema } from "../../../api/admin/server-configurator/validators"
import { POST as previewPost } from "../../../api/admin/server-configurator/core-wizard/preview/route"
import { POST as impactPost } from "../../../api/admin/server-configurator/impact-analysis/route"
import { buildCapabilityProfileDraftPayload, buildServerModelDraftPayload, CORE_SERVER_WIZARD_STEPS, validateCoreServerDraft } from "../core-server-wizard"

const completeDraft = () => CoreServerDraftSchema.parse({
  creation_method: "generation_template",
  identity: { vendor: "Vendor", family: "Family", generation: "G1", model: "M1", public_name: "Vendor M1", slug: "vendor-m1", form_factor: "1U", chassis_type: "8SFF", source_document: "Vendor technical guide section 2" },
  platform: { technology_platform_id: "platform_1", vendor_generation_template_id: "generation_1", inherited_pack_ids: [], exclusions: [] },
  cpu: { socket_concept_id: "concept_socket", socket_quantity: 2, ownership: "per_socket", suggested_pack_ids: ["pack_cpu"] },
  memory: { technology_concept_id: "concept_memory", module_types: ["RDIMM"], slots_per_cpu: 8, channels_per_cpu: 8, max_capacity_gb: 2048, population_profiles: [], suggested_pack_ids: ["pack_ram"] },
  storage: { chassis_variants: [{ key: "8sff", name: "8 SFF", front_bays: 8, rear_bays: 0, drive_form_factor: "2.5", backplane_reference: "Guide p. 12" }], storage_option_ids: [], protocols: ["SAS"], controller_component_ids: ["raid_1"], suggested_drive_pack_ids: ["pack_drive"] },
  expansion: { risers: [], slots: [{ key: "slot-1", generation: "4", lanes: 16, cpu_owner: "cpu-1" }], ocp_slots: [], conflicts: [] },
  power: { psu_pack_ids: ["pack_psu"], max_watts: 1600, psu_summary: "Redundant PSU family", cooling_mode: "air", fan_pack_ids: [], heatsink_pack_ids: [], thermal_zones: [], conditions: [] },
  network: { embedded_component_ids: [], nic_pack_ids: ["pack_nic"], management_concept_id: "concept_bmc", boot_group_ids: [], direct_component_ids: [], bundle_ids: [] },
  optional_groups: { option_group_ids: [] },
  product_strategy: "single_card_chassis_options",
  properties: { assignments: [] },
  simulation: { representative_components: [{ component_id: "cpu_1", quantity: 2 }, { component_id: "ram_1", quantity: 8 }], explicit_none: [], storage_option_ids: [] },
  review: { reviewer: "reviewer_1", publication_confirmed: false },
})

describe("core server creation wizard", () => {
  it("defines exactly the controlled 14-step flow", () => {
    expect(CORE_SERVER_WIZARD_STEPS).toHaveLength(14)
    expect(CORE_SERVER_WIZARD_STEPS[0]).toBe("Creation method")
    expect(CORE_SERVER_WIZARD_STEPS[13]).toBe("Draft, review & publish")
  })

  it("accepts a complete source-backed draft and blocks free-text/missing socket concepts", () => {
    const draft = completeDraft()
    expect(validateCoreServerDraft(draft).ready_for_review).toBe(true)
    const missing = { ...draft, cpu: { ...draft.cpu, socket_concept_id: "" } }
    expect(validateCoreServerDraft(missing).blockers).toEqual(expect.arrayContaining([expect.objectContaining({ field: "cpu.socket_concept_id", step: 4 })]))
  })

  it("adapts canonical capability data into a disabled legacy-readable server without commerce IDs", () => {
    const draft = completeDraft()
    const model = buildServerModelDraftPayload(draft, { stable_key: "socket.lga4677", display_name: "LGA4677" })
    const profile = buildCapabilityProfileDraftPayload(draft, "server_1")
    expect(model).toEqual(expect.objectContaining({ cpu_socket: "socket.lga4677", max_cpu: 2, ram_slots_total: 16, medusa_product_id: null, medusa_variant_id: null, enabled: false }))
    expect(profile.cpu_json.socket_concept_id).toBe("concept_socket")
    expect(profile.source_json.reference).toBe(draft.identity.source_document)
  })

  it("keeps preview side-effect free and runs the stage-04 engine only on a materialized graph", async () => {
    const draft = { ...completeDraft(), materialized_server_model_id: "server_1" }
    const service: Record<string, jest.Mock> = {
      retrieveTechnologyPlatform: jest.fn(async () => ({ properties_json: { platform: true } })),
      retrieveVendorGenerationTemplate: jest.fn(async () => ({ inherited_properties_json: { generation: true } })),
      listPackAssignments: jest.fn(async () => []),
      validateCompatibilityReadiness: jest.fn(async () => ({ ready: true, status: "ready", blockers: [] })),
      createServerModels: jest.fn(), updateServerModels: jest.fn(), deleteServerModels: jest.fn(),
    }
    const response = { json: jest.fn() }
    await previewPost({ validatedBody: { draft }, scope: { resolve: () => service } } as never, response as never)
    expect(service.validateCompatibilityReadiness).toHaveBeenCalledWith(expect.objectContaining({ server_model_id: "server_1", mode: "assisted_preview" }))
    expect(service.createServerModels).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ writes_performed: false, materialization_required: false }))
  })

  it("returns read-only shared-property impact including configurations that require revalidation", async () => {
    const service = {
      listPropertyAssignments: jest.fn(async () => [{ owner_type: "server_model", owner_id: "server_1" }, { owner_type: "component", owner_id: "component_1" }]),
      listPropertyValues: jest.fn(async () => []),
      listConfigurations: jest.fn(async () => [{ id: "config_1", server_model_id: "server_1", status: "valid", medusa_cart_id: "cart_1" }]),
    }
    const response = { json: jest.fn() }
    await impactPost({ validatedBody: { entity_type: "property_definition", entity_id: "property_1" }, scope: { resolve: () => service } } as never, response as never)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ affected_server_models: ["server_1"], affected_components: ["component_1"], affected_ready_configurations: ["config_1"], revalidation_required: true, writes_performed: false }))
  })

  it("contains compensation and automatic product creation without prices, Genius or Bulk behavior", () => {
    const root = process.cwd()
    const materialize = fs.readFileSync(path.join(root, "src/workflows/server-configurator/core-wizard/materialize-core-server.ts"), "utf8")
    const publish = fs.readFileSync(path.join(root, "src/workflows/server-configurator/core-wizard/publish-core-server.ts"), "utf8")
    const ui = fs.readFileSync(path.join(root, "src/admin/routes/server-configurator/server-wizard/page.tsx"), "utf8")
    expect(materialize).toContain("compensation is idempotent")
    expect(publish).toContain("createProductsWorkflow")
    expect(publish).toContain("deleteProductsWorkflow")
    expect(publish).not.toMatch(/\bprices\s*:/)
    expect(ui).toContain("Open Genius Bootstrap")
    expect(ui).not.toMatch(/Assisted Draft|Bulk Apply|bulk_apply/)
  })
})
