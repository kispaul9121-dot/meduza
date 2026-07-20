import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createReadyConfigurationVersionStep, prepareReadyConfigurationStep, ReadyConfigurationInput, updateReadyConfigurationVersionPointerStep } from "./steps"

export const revalidateReadyConfigurationWorkflow = createWorkflow(
  "revalidate-ready-configuration",
  function (input: ReadyConfigurationInput) {
    const prepared = prepareReadyConfigurationStep(input)
    const versionInput = transform({ prepared, input }, ({ prepared, input }) => ({
      ready_configuration_id: input.id,
      version: prepared.version,
      frozen: prepared.frozen,
      validation: prepared.validation,
      created_from: prepared.created_from,
      source_configuration_id: prepared.source_configuration_id,
      publish: prepared.publish,
    }))
    const version = createReadyConfigurationVersionStep(versionInput)
    const pointerInput = transform({ prepared, input }, ({ prepared, input }) => ({
      id: input.id,
      row: prepared.row,
      version: prepared.version,
      publish: prepared.publish,
    }))
    const ready = updateReadyConfigurationVersionPointerStep(pointerInput)
    return new WorkflowResponse({ ready_configuration: ready, version })
  }
)
