import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator"
import { ReorderReadyConfigurationsBody } from "../../validators"

const reorderReadyConfigurationsStep = createStep(
  "reorder-ready-configurations",
  async (input: ReorderReadyConfigurationsBody, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await Promise.all(input.items.map((item) => service.retrieveReadyConfiguration(item.id)))
    const ready = await service.updateReadyConfigurations(input.items)
    return new StepResponse(ready, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateReadyConfigurations(previous)
  }
)

const reorderReadyConfigurationsWorkflow = createWorkflow(
  "reorder-ready-configurations",
  function (input: ReorderReadyConfigurationsBody) {
    return new WorkflowResponse(reorderReadyConfigurationsStep(input))
  }
)

export async function POST(req: MedusaRequest<ReorderReadyConfigurationsBody>, res: MedusaResponse) {
  const { result } = await reorderReadyConfigurationsWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ ready_configurations: result })
}
