import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { duplicateComponentPackStep } from "./shared/crud-steps"
import { PackIdInput } from "./shared/types"

export const duplicateComponentPackWorkflow = createWorkflow(
  "duplicate-server-configurator-component-pack-workflow",
  function (input: PackIdInput) {
    const result = duplicateComponentPackStep(input)
    return new WorkflowResponse(result)
  }
)
