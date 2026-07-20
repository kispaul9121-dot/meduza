import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { changeReadyConfigurationStatusStep } from "./steps"

export const changeReadyConfigurationStatusWorkflow = createWorkflow(
  "change-ready-configuration-status",
  function (input: { id: string; status: "unpublished" | "archived" }) {
    return new WorkflowResponse(changeReadyConfigurationStatusStep(input))
  }
)
