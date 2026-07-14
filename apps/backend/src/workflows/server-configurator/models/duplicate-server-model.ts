import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { duplicateServerModelStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const duplicateServerModelWorkflow = createWorkflow(
  "duplicate-server-configurator-model-workflow",
  function (input: EntityIdInput) {
    const result = duplicateServerModelStep(input)
    return new WorkflowResponse(result)
  }
)
