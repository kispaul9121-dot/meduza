import { VALIDATOR_REGISTRY } from "./engine"

export type SmartBuilderAnswers = {
  intent: "alternatives" | "unique_component" | "assembly_bundle" | "storage_configuration" | "new_component_type" | "import_list"
  reuse_model_count: number
  component_count: number
  adds_resources: string[]
  affects_compatibility: boolean
}

export function recommendSmartEntity(answers: SmartBuilderAnswers) {
  let entity_type: "ComponentPack" | "ServerModelComponentAssignment" | "AssemblyBundle" | "StorageTopology" | "ComponentTypeDefinition"
  let reason: string
  if (answers.intent === "new_component_type") {
    entity_type = "ComponentTypeDefinition"
    reason = "A previously unknown physical class needs a canonical type and validator contract before components are created."
  } else if (answers.intent === "storage_configuration" || answers.adds_resources.includes("bays")) {
    entity_type = "StorageTopology"
    reason = "The object changes physical bays/zones, so it must be represented as topology rather than a component list."
  } else if (answers.intent === "assembly_bundle" || answers.component_count > 1 && answers.intent !== "alternatives") {
    entity_type = "AssemblyBundle"
    reason = "Several parts are installed together and need one compensated apply/rollback policy."
  } else if (answers.intent === "alternatives" || answers.reuse_model_count >= 4) {
    entity_type = "ComponentPack"
    reason = "Many interchangeable candidates or broad reuse belong in a reusable candidate pack."
  } else {
    entity_type = "ServerModelComponentAssignment"
    reason = answers.reuse_model_count <= 1 ? "A model-specific part should remain a direct assignment." : "Reuse is still limited; keep a direct assignment now and offer conversion when usage grows."
  }
  const warnings: string[] = []
  if (entity_type === "AssemblyBundle" && answers.component_count <= 1) warnings.push("A one-item bundle is usually unnecessary.")
  if (answers.reuse_model_count >= 4 && entity_type === "ServerModelComponentAssignment") warnings.push("This component is used by at least four models; consider a pack.")
  return { entity_type, reason, warnings, available_validator_keys: Object.keys(VALIDATOR_REGISTRY).sort() }
}
