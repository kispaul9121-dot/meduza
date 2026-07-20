import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { duplicateRuleStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const duplicateRuleWorkflow = createWorkflow(
  "duplicate-server-configurator-rule-workflow",
  function (input: EntityIdInput) {
    const result = duplicateRuleStep(input)
    return new WorkflowResponse(result)
  }
)
