import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { detachPackApplicabilityStep } from "./shared/applicability-steps"
import { PackIdInput } from "./shared/types"

export const detachPackApplicabilityWorkflow = createWorkflow(
  "detach-server-configurator-pack-applicability-workflow",
  function (input: PackIdInput) {
    const result = detachPackApplicabilityStep(input)
    return new WorkflowResponse(result)
  }
)
