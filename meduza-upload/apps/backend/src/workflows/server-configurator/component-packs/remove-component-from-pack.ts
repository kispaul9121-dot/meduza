import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { removeComponentFromPackStep } from "./shared/item-steps"
import { RemovePackItemInput } from "./shared/types"

export const removeComponentFromPackWorkflow = createWorkflow(
  "remove-server-configurator-component-from-pack-workflow",
  function (input: RemovePackItemInput) {
    const result = removeComponentFromPackStep(input)
    return new WorkflowResponse(result)
  }
)
