import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { reviewRuleStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const reviewRuleWorkflow = createWorkflow(
  "review-server-configurator-rule-workflow",
  function (input: EntityIdInput) {
    const result = reviewRuleStep(input)
    return new WorkflowResponse(result)
  }
)
