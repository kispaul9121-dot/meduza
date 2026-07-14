import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateRulePresetStep } from "../shared/steps"
import { EntityUpdateInput } from "../shared/types"

export const updateRulePresetWorkflow = createWorkflow(
  "update-server-configurator-rule-preset-workflow",
  function (input: EntityUpdateInput) {
    const result = updateRulePresetStep(input)
    return new WorkflowResponse(result)
  }
)
