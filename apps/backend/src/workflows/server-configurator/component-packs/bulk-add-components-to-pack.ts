import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { bulkAddComponentsToPackStep } from "./shared/item-steps"
import { BulkAddPackItemsInput } from "./shared/types"

export const bulkAddComponentsToPackWorkflow = createWorkflow(
  "bulk-add-server-configurator-components-to-pack-workflow",
  function (input: BulkAddPackItemsInput) {
    const result = bulkAddComponentsToPackStep(input)
    return new WorkflowResponse(result)
  }
)
