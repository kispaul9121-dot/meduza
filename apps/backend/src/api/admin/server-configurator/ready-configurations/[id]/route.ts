import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { revalidateReadyConfigurationWorkflow } from "../../../../../workflows/server-configurator/ready-configurations/revalidate-ready-configuration"
import { changeReadyConfigurationStatusWorkflow } from "../../../../../workflows/server-configurator/ready-configurations/change-ready-configuration-status"
import { ReadyConfigurationMutationBody } from "../../validators"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const ready = await service.retrieveReadyConfiguration(req.params.id)
  const versions = await service.listReadyConfigurationVersions(
    { ready_configuration_id: req.params.id },
    { take: 100, order: { version: "DESC" } }
  )
  res.json({ ready_configuration: ready, versions })
}

export async function POST(req: MedusaRequest<ReadyConfigurationMutationBody>, res: MedusaResponse) {
  const { result } = await revalidateReadyConfigurationWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody, publish: false },
  })
  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await changeReadyConfigurationStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: "archived" },
  })
  res.json({ ready_configuration: result })
}
