import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { reorderPackItemsStep } from "./shared/item-steps"
import { ReorderPackItemsInput } from "./shared/types"

export const reorderPackItemsWorkflow = createWorkflow(
  "reorder-server-configurator-pack-items-workflow",
  function (input: ReorderPackItemsInput) {
    const result = reorderPackItemsStep(input)
    return new WorkflowResponse(result)
  }
)
