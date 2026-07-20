import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createReadyConfigurationWorkflow } from "../../../../../../workflows/server-configurator/ready-configurations/create-ready-configuration"
import { revalidateReadyConfigurationWorkflow } from "../../../../../../workflows/server-configurator/ready-configurations/revalidate-ready-configuration"
import { changeReadyConfigurationStatusWorkflow } from "../../../../../../workflows/server-configurator/ready-configurations/change-ready-configuration-status"
import { refreshReadyConfigurationStalenessWorkflow } from "../../../../../../workflows/server-configurator/ready-configurations/refresh-ready-configuration-staleness"
import { ReadyConfigurationMutationBody } from "../../../validators"

export async function POST(req: MedusaRequest<ReadyConfigurationMutationBody>, res: MedusaResponse) {
  const action = req.params.action
  if (["validate", "revalidate", "publish"].includes(action)) {
    const { result } = await revalidateReadyConfigurationWorkflow(req.scope).run({
      input: { id: req.params.id, ...req.validatedBody, publish: action === "publish", created_from: "revalidation" },
    })
    return res.json(result)
  }
  if (action === "duplicate") {
    const { result } = await createReadyConfigurationWorkflow(req.scope).run({
      input: { ...req.validatedBody, source_ready_configuration_id: req.params.id, created_from: "duplicate" },
    })
    return res.status(201).json(result)
  }
  if (action === "unpublish") {
    const { result } = await changeReadyConfigurationStatusWorkflow(req.scope).run({
      input: { id: req.params.id, status: "unpublished" },
    })
    return res.json({ ready_configuration: result })
  }
  if (action === "refresh-staleness") {
    const { result } = await refreshReadyConfigurationStalenessWorkflow(req.scope).run({ input: { id: req.params.id } })
    return res.json(result)
  }
  throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Unsupported ready configuration action: ${action}`)
}
