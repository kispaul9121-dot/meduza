import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteComponentStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const deleteComponentWorkflow = createWorkflow(
  "delete-server-configurator-component-workflow",
  function (input: EntityIdInput) {
    const result = deleteComponentStep(input)
    return new WorkflowResponse(result)
  }
)
