import { MedusaContainer } from "@medusajs/framework"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"
import { collectAnnotations, collectComponents, collectPresets, collectRules } from "./payloud/collect"
import { report } from "./payloud/report"
import { readSource } from "./payloud/read-source"
import { sourceFiles } from "./payloud/source-files"
import { upsertAnnotations, upsertComponents, upsertPresets, upsertRules } from "./payloud/upsert"

export default async function importPayloudData({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any

  await readSource(sourceFiles.dl360Servers)
  await readSource(sourceFiles.optionAnnotations)
  await readSource(sourceFiles.optionUiState)
  await readSource(sourceFiles.backplaneSync)

  const components = await collectComponents()
  const annotations = await collectAnnotations()
  const rules = await collectRules()
  const presets = collectPresets()

  await upsertComponents(service, components)
  await upsertAnnotations(service, annotations)
  await upsertRules(service, rules)
  await upsertPresets(service, presets)

  console.log(JSON.stringify(report, null, 2))
}
