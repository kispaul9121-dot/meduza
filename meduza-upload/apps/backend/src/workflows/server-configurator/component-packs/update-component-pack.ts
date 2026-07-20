import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateComponentPackStep } from "./shared/crud-steps"
import { PackUpdateInput } from "./shared/types"

export const updateComponentPackWorkflow = createWorkflow(
  "update-server-configurator-component-pack-workflow",
  function (input: PackUpdateInput) {
    const result = updateComponentPackStep(input)
    return new WorkflowResponse(result)
  }
)
