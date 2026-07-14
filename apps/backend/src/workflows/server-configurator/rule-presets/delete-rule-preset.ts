import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { deleteRulePresetStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const deleteRulePresetWorkflow = createWorkflow(
  "delete-server-configurator-rule-preset-workflow",
  function (input: EntityIdInput) {
    const result = deleteRulePresetStep(input)
    return new WorkflowResponse(result)
  }
)
