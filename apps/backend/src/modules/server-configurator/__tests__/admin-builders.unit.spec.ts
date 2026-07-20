import { recommendSmartEntity } from "../admin-builders"

describe("smart admin entity recommendation", () => {
  const answer = { reuse_model_count: 1, component_count: 1, adds_resources: [] as string[], affects_compatibility: true }

  it.each([
    ["alternatives", "ComponentPack"],
    ["unique_component", "ServerModelComponentAssignment"],
    ["assembly_bundle", "AssemblyBundle"],
    ["storage_configuration", "StorageTopology"],
    ["new_component_type", "ComponentTypeDefinition"],
  ] as const)("maps %s to %s deterministically", (intent, entityType) => {
    expect(recommendSmartEntity({ ...answer, intent }).entity_type).toBe(entityType)
  })

  it("promotes broad reuse to a pack without vendor-specific policy", () => {
    const result = recommendSmartEntity({ ...answer, intent: "unique_component", reuse_model_count: 7 })
    expect(result.entity_type).toBe("ComponentPack")
    expect(JSON.stringify(result).toLowerCase()).not.toMatch(/dell|hpe|lenovo|supermicro/)
  })

  it("returns only closed engine validator registry keys", () => {
    const result = recommendSmartEntity({ ...answer, intent: "new_component_type" })
    expect(result.available_validator_keys).toEqual(expect.arrayContaining(["cpu", "memory", "storage", "power"]))
    expect(result.available_validator_keys).not.toContain("arbitrary_script")
  })
})
