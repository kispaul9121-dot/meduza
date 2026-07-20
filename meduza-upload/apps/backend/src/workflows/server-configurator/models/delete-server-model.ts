import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteServerModelStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const deleteServerModelWorkflow = createWorkflow(
  "delete-server-configurator-model-workflow",
  function (input: EntityIdInput) {
    const result = deleteServerModelStep(input)
    return new WorkflowResponse(result)
  }
)
