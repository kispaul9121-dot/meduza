import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createRulePresetStep } from "../shared/steps"
import { EntityPayload } from "../shared/types"

export const createRulePresetWorkflow = createWorkflow(
  "create-server-configurator-rule-preset-workflow",
  function (input: EntityPayload) {
    const result = createRulePresetStep(input)
    return new WorkflowResponse(result)
  }
)
