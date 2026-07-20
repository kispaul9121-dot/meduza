import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { duplicateComponentStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const duplicateComponentWorkflow = createWorkflow(
  "duplicate-server-configurator-component-workflow",
  function (input: EntityIdInput) {
    const result = duplicateComponentStep(input)
    return new WorkflowResponse(result)
  }
)
