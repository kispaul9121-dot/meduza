import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { duplicateRulePresetStep } from "../shared/steps"
import { EntityIdInput } from "../shared/types"

export const duplicateRulePresetWorkflow = createWorkflow(
  "duplicate-server-configurator-rule-preset-workflow",
  function (input: EntityIdInput) {
    const result = duplicateRulePresetStep(input)
    return new WorkflowResponse(result)
  }
)
