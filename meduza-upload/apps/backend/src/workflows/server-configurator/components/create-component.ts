import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createComponentStep } from "../shared/steps"
import { EntityPayload } from "../shared/types"

export const createComponentWorkflow = createWorkflow(
  "create-server-configurator-component-workflow",
  function (input: EntityPayload) {
    const result = createComponentStep(input)
    return new WorkflowResponse(result)
  }
)
