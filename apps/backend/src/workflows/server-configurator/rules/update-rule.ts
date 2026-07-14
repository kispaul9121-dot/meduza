import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateRuleStep } from "../shared/steps"
import { EntityUpdateInput } from "../shared/types"

export const updateRuleWorkflow = createWorkflow(
  "update-server-configurator-rule-workflow",
  function (input: EntityUpdateInput) {
    const result = updateRuleStep(input)
    return new WorkflowResponse(result)
  }
)
