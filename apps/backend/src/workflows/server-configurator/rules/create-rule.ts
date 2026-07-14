import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createRuleStep } from "../shared/steps"
import { EntityPayload } from "../shared/types"

export const createRuleWorkflow = createWorkflow(
  "create-server-configurator-rule-workflow",
  function (input: EntityPayload) {
    const result = createRuleStep(input)
    return new WorkflowResponse(result)
  }
)
