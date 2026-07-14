import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createServerModelStep } from "../shared/steps"
import { EntityPayload } from "../shared/types"

export const createServerModelWorkflow = createWorkflow(
  "create-server-configurator-model-workflow",
  function (input: EntityPayload) {
    const result = createServerModelStep(input)
    return new WorkflowResponse(result)
  }
)
