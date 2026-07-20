import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { refreshReadyConfigurationStalenessStep } from "./steps"

export const refreshReadyConfigurationStalenessWorkflow = createWorkflow(
  "refresh-ready-configuration-staleness",
  function (input: { id: string }) {
    return new WorkflowResponse(refreshReadyConfigurationStalenessStep(input))
  }
)
