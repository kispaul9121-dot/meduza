import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createHelpAnnotationStep } from "../shared/steps"
import { EntityPayload } from "../shared/types"

export const createHelpAnnotationWorkflow = createWorkflow(
  "create-server-configurator-help-annotation-workflow",
  function (input: EntityPayload) {
    const result = createHelpAnnotationStep(input)
    return new WorkflowResponse(result)
  }
)
