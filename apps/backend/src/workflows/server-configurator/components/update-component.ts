import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateComponentStep } from "../shared/steps"
import { EntityUpdateInput } from "../shared/types"

export const updateComponentWorkflow = createWorkflow(
  "update-server-configurator-component-workflow",
  function (input: EntityUpdateInput) {
    const result = updateComponentStep(input)
    return new WorkflowResponse(result)
  }
)
