import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateHelpAnnotationStep } from "../shared/steps"
import { EntityUpdateInput } from "../shared/types"

export const updateHelpAnnotationWorkflow = createWorkflow(
  "update-server-configurator-help-annotation-workflow",
  function (input: EntityUpdateInput) {
    const result = updateHelpAnnotationStep(input)
    return new WorkflowResponse(result)
  }
)
