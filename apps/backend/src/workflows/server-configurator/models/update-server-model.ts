import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateServerModelStep } from "../shared/steps"
import { EntityUpdateInput } from "../shared/types"

export const updateServerModelWorkflow = createWorkflow(
  "update-server-configurator-model-workflow",
  function (input: EntityUpdateInput) {
    const result = updateServerModelStep(input)
    return new WorkflowResponse(result)
  }
)
