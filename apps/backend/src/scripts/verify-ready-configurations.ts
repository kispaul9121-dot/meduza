import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"
import { createReadyConfigurationWorkflow } from "../workflows/server-configurator/ready-configurations/create-ready-configuration"
import { revalidateReadyConfigurationWorkflow } from "../workflows/server-configurator/ready-configurations/revalidate-ready-configuration"

export default async function verifyReadyConfigurations({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const models = await service.listServerModels({ enabled: true }, { take: 1, order: { public_name: "ASC" } })
  if (!models[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No enabled server model is available for ReadyConfiguration verification")
  const slug = `stage-11-verification-${Date.now()}`
  const createdIds: string[] = []
  const versionIds: string[] = []
  try {
    const created = await createReadyConfigurationWorkflow(container).run({
      input: {
        name: "Stage 11 verification",
        slug,
        use_case: "verification",
        server_model_id: models[0].id,
        selected_components: [],
        price_mode: "request_quote",
        created_from: "simulator",
      },
    })
    createdIds.push(created.result.ready_configuration.id)
    versionIds.push(created.result.version.id)
    let publishBlocked = false
    try {
      await revalidateReadyConfigurationWorkflow(container).run({
        input: { id: created.result.ready_configuration.id, publish: true },
      })
    } catch {
      publishBlocked = true
    }
    if (!publishBlocked) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid ReadyConfiguration publication was not blocked")
    const duplicate = await createReadyConfigurationWorkflow(container).run({
      input: {
        name: "Stage 11 verification copy",
        slug: `${slug}-copy`,
        source_ready_configuration_id: created.result.ready_configuration.id,
        created_from: "duplicate",
      },
    })
    createdIds.push(duplicate.result.ready_configuration.id)
    versionIds.push(duplicate.result.version.id)
    const cloneSnapshot = duplicate.result.version.snapshot_json as any
    if (cloneSnapshot.server_model.id !== models[0].id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Duplicated snapshot lost server model identity")
    console.log(JSON.stringify({
      stage: 11,
      model: models[0].slug,
      draft_status: created.result.ready_configuration.status,
      validation_status: created.result.version.status,
      publish_blocked: publishBlocked,
      duplicate_created: true,
      clone_selected_count: cloneSnapshot.selected_components.length,
      snapshot_hash_preserved: duplicate.result.version.snapshot_hash === created.result.version.snapshot_hash,
    }))
  } finally {
    if (versionIds.length) await service.deleteReadyConfigurationVersions(versionIds)
    if (createdIds.length) await service.deleteReadyConfigurations(createdIds)
  }
}
