import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateComponentApplicabilityStep } from "../shared/steps"
import { ComponentApplicabilityInput } from "../shared/types"

export const updateComponentApplicabilityWorkflow = createWorkflow(
  "update-server-configurator-component-applicability-workflow",
  function (input: ComponentApplicabilityInput) {
    const result = updateComponentApplicabilityStep(input)
    return new WorkflowResponse(result)
  }
)
