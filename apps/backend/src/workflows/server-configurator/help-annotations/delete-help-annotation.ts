import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteHelpAnnotationStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const deleteHelpAnnotationWorkflow = createWorkflow(
  "delete-server-configurator-help-annotation-workflow",
  function (input: EntityIdInput) {
    const result = deleteHelpAnnotationStep(input)
    return new WorkflowResponse(result)
  }
)
