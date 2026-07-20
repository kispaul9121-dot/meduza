import fs from "node:fs"
import path from "node:path"
import { KnowledgeEntityMutationSchema, SmartBuilderApplySchema, SmartBuilderDraftSchema, SmartBuilderPreviewSchema } from "../../../api/admin/server-configurator/validators"
import { POST as previewPost } from "../../../api/admin/server-configurator/smart-builder/preview/route"

describe("stage 05 admin contracts", () => {
  it("accepts typed property data and rejects an untyped property", () => {
    expect(KnowledgeEntityMutationSchema.safeParse({ entity_type: "property_definition", data: { key: "cpu.socket", label: "CPU socket", value_type: "text", entity_scopes: ["component"], schema_version: 1 } }).success).toBe(true)
    expect(KnowledgeEntityMutationSchema.safeParse({ entity_type: "property_definition", data: { key: "cpu.socket" } }).success).toBe(false)
  })

  it("validates resumable drafts and rejects invalid storage bay capacity", () => {
    expect(SmartBuilderDraftSchema.safeParse({ current_step: "6", draft_payload_json: { intent: "alternatives" } }).success).toBe(true)
    const invalid = { entity_kind: "storage_topology", server_model_id: "srv_1", cage: { name: "Front", location: "front", hot_swap: true, bay_groups: [{ key: "front", count: 0, native_form_factor: "2.5", accepted_form_factors: [], zone_id: "front", protocols: ["SAS"] }] }, backplane: { name: "SAS", supported_protocols: ["SAS"], connector_types: [], connection_mode: "direct_attach" }, option: { key: "front", public_name: "Front", is_base: true, is_default: true } }
    expect(SmartBuilderApplySchema.safeParse(invalid).success).toBe(false)
  })

  it("keeps preview side-effect free and delegates compatibility to stage 04", async () => {
    const service: Record<string, jest.Mock> = {
      retrieveServerModel: jest.fn(async () => ({ id: "srv_1" })),
      listChassisVariants: jest.fn(async () => []),
      listCapabilityProfiles: jest.fn(async () => []),
      listStorageTopologies: jest.fn(async () => []),
      listServerModelComponentAssignments: jest.fn(async () => []),
      listComponents: jest.fn(async () => []),
      validateCompatibilityReadiness: jest.fn(async () => ({ ready: true, blockers: [] })),
      createComponents: jest.fn(), updateComponents: jest.fn(), deleteComponents: jest.fn(),
    }
    const validatedBody = SmartBuilderPreviewSchema.parse({ intent: "unique_component", reuse_model_count: 1, component_count: 1, adds_resources: [], affects_compatibility: true, server_model_id: "srv_1", selected_components: [] })
    const response = { json: jest.fn() }
    await previewPost({ validatedBody, scope: { resolve: () => service } } as never, response as never)
    expect(service.validateCompatibilityReadiness).toHaveBeenCalledWith(expect.objectContaining({ server_model_id: "srv_1", mode: "assisted_preview" }))
    expect(service.createComponents).not.toHaveBeenCalled()
    expect(service.updateComponents).not.toHaveBeenCalled()
    expect(service.deleteComponents).not.toHaveBeenCalled()
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ writes_performed: false, deterministic: true }))
  })

  it("uses the authenticated SDK and preserves compensated create-and-return workflows", () => {
    const adminRoot = path.join(process.cwd(), "src/admin/routes/server-configurator")
    const uiFiles = ["knowledge-base/page.tsx", "smart-builder/page.tsx", "option-groups/page.tsx", "models/[id]/direct-components/page.tsx"]
    const ui = uiFiles.map((file) => fs.readFileSync(path.join(adminRoot, file), "utf8")).join("\n")
    const smartWorkflow = fs.readFileSync(path.join(process.cwd(), "src/workflows/server-configurator/smart-builder/apply-smart-builder.ts"), "utf8")
    const conversionWorkflow = fs.readFileSync(path.join(process.cwd(), "src/workflows/server-configurator/smart-builder/convert-direct-to-pack.ts"), "utf8")
    expect(ui).not.toMatch(/\bfetch\s*\(/)
    expect(ui).toContain("adminPost")
    expect(ui).toContain("compatibility-readiness")
    expect(smartWorkflow).toMatch(/(?:idempotent.*compensation|compensation.*idempotent)/)
    expect(conversionWorkflow).toMatch(/(?:idempotent.*compensation|compensation.*idempotent)/)
  })

  it("adds only the new audit table in the forward migration", () => {
    const migration = fs.readFileSync(path.join(process.cwd(), "src/modules/server-configurator/migrations/Migration20260720164322.ts"), "utf8")
    const up = migration.slice(migration.indexOf("override async up"), migration.indexOf("override async down"))
    expect(up).toContain('create table if not exists "server_configurator_admin_audit_event"')
    expect(up).toContain("IDX_server_configurator_admin_audit_event_entity")
    expect(up).not.toMatch(/drop table|drop column|truncate|delete from/i)
  })
})
