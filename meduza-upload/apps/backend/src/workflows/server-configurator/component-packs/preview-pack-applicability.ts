import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { previewPackApplicabilityStep } from "./shared/applicability-steps"
import { PackApplicabilityInput } from "./shared/types"

export const previewPackApplicabilityWorkflow = createWorkflow(
  "preview-server-configurator-pack-applicability-workflow",
  function (input: PackApplicabilityInput) {
    const result = previewPackApplicabilityStep(input)
    return new WorkflowResponse(result)
  }
)
