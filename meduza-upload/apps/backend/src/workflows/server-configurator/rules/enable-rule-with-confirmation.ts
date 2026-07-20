import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { enableRuleWithConfirmationStep } from "../shared/steps"
import { EnableRuleWithConfirmationInput } from "../shared/types"

export const enableRuleWithConfirmationWorkflow = createWorkflow(
  "enable-server-configurator-rule-with-confirmation-workflow",
  function (input: EnableRuleWithConfirmationInput) {
    const result = enableRuleWithConfirmationStep(input)
    return new WorkflowResponse(result)
  }
)
