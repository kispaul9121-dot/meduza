import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createReadyConfigurationStep, createReadyConfigurationVersionStep, prepareReadyConfigurationStep, ReadyConfigurationInput } from "./steps"

export const createReadyConfigurationWorkflow = createWorkflow(
  "create-ready-configuration",
  function (input: ReadyConfigurationInput) {
    const prepared = prepareReadyConfigurationStep(input)
    const ready = createReadyConfigurationStep(prepared)
    const versionInput = transform({ prepared, ready }, ({ prepared, ready }) => ({
      ready_configuration_id: ready.id,
      version: 1,
      frozen: prepared.frozen,
      validation: prepared.validation,
      created_from: prepared.created_from,
      source_configuration_id: prepared.source_configuration_id,
      publish: prepared.publish,
    }))
    const version = createReadyConfigurationVersionStep(versionInput)
    return new WorkflowResponse({ ready_configuration: ready, version })
  }
)
