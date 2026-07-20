import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createComponentPackStep } from "./shared/crud-steps"

export const createComponentPackWorkflow = createWorkflow(
  "create-server-configurator-component-pack-workflow",
  function (input: Record<string, unknown>) {
    const result = createComponentPackStep(input)
    return new WorkflowResponse(result)
  }
)
