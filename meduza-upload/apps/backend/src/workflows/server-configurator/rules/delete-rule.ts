import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteRuleStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const deleteRuleWorkflow = createWorkflow(
  "delete-server-configurator-rule-workflow",
  function (input: EntityIdInput) {
    const result = deleteRuleStep(input)
    return new WorkflowResponse(result)
  }
)
