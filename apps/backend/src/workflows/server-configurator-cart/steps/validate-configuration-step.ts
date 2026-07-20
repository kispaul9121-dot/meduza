import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import {
  AddConfiguredServerToCartInput,
  ConfiguredServerValidationResult,
} from "../types"

export const invalidConfiguredServerMessage = "CONFIGURED_SERVER_INVALID"

function canonicalSelection(items: Array<{ component_id: string; quantity: number }>) {
  return items
    .map((item) => ({ component_id: item.component_id, quantity: item.quantity || 1 }))
    .sort((a, b) => a.component_id.localeCompare(b.component_id))
}

export const validateConfigurationStep = createStep(
  "validate-configured-server-for-cart",
  async (input: AddConfiguredServerToCartInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const [serverModel] = await service.listServerModels({
      slug: input.server_model_slug,
    })

    if (!serverModel) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Server model ${input.server_model_slug} was not found.`
      )
    }

    if (!serverModel.medusa_variant_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Server model ${input.server_model_slug} has no Medusa base variant.`
      )
    }

    if (input.ready_configuration_id) {
      const [ready] = await service.listReadyConfigurations({ id: input.ready_configuration_id })
      const expectedVersion = input.ready_configuration_version ?? ready?.published_version
      const [version] = ready && expectedVersion
        ? await service.listReadyConfigurationVersions({
            ready_configuration_id: ready.id,
            version: expectedVersion,
          })
        : []
      const stale = !ready || ready.status !== "published" || ready.stale || !version
      const identityMismatch = Boolean(
        version && (
          version.snapshot_hash !== input.ready_snapshot_hash ||
          version.snapshot_json?.server_model?.slug !== input.server_model_slug ||
          JSON.stringify(canonicalSelection(version.snapshot_json?.selected_components || [])) !==
            JSON.stringify(canonicalSelection(input.selected_components))
        )
      )
      if (stale || identityMismatch) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "READY_CONFIGURATION_STALE_OR_TAMPERED"
        )
      }
    }

    const result = await service.validateConfiguration({
      server_model_slug: input.server_model_slug,
      selected_components: input.selected_components,
      storage_option_id: input.storage_option_id,
      explicit_none: input.explicit_none,
      mode: "production_validation",
    })
    const validation: ConfiguredServerValidationResult = {
      ...result,
      server_model: serverModel,
    }

    if (!validation.valid) {
      const error = new MedusaError(
        MedusaError.Types.INVALID_DATA,
        invalidConfiguredServerMessage
      ) as MedusaError & { validationResult?: ConfiguredServerValidationResult }
      error.validationResult = validation
      throw error
    }

    return new StepResponse(validation)
  }
)
