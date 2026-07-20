import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addComponentToPackStep } from "./shared/item-steps"
import { AddPackItemInput } from "./shared/types"

export const addComponentToPackWorkflow = createWorkflow(
  "add-server-configurator-component-to-pack-workflow",
  function (input: AddPackItemInput) {
    const result = addComponentToPackStep(input)
    return new WorkflowResponse(result)
  }
)
