import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { applyPackApplicabilityStep } from "./shared/applicability-steps"
import { PackApplicabilityInput } from "./shared/types"

export const applyPackApplicabilityWorkflow = createWorkflow(
  "apply-server-configurator-pack-applicability-workflow",
  function (input: PackApplicabilityInput) {
    const result = applyPackApplicabilityStep(input)
    return new WorkflowResponse(result)
  }
)
