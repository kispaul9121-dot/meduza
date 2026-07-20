import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteComponentPackStep } from "./shared/crud-steps"
import { PackIdInput } from "./shared/types"

export const deleteComponentPackWorkflow = createWorkflow(
  "delete-server-configurator-component-pack-workflow",
  function (input: PackIdInput) {
    const result = deleteComponentPackStep(input)
    return new WorkflowResponse(result)
  }
)
