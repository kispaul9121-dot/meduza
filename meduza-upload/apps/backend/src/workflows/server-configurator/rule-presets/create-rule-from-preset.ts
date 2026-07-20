import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createRuleFromPresetStep } from "../shared/steps"
import { CreateRuleFromPresetInput } from "../shared/types"

export const createRuleFromPresetWorkflow = createWorkflow(
  "create-server-configurator-rule-from-preset-workflow",
  function (input: CreateRuleFromPresetInput) {
    const result = createRuleFromPresetStep(input)
    return new WorkflowResponse(result)
  }
)
