import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import {
  AddConfiguredServerToCartInput,
  ConfiguredServerValidationResult,
} from "../types"

export const invalidConfiguredServerMessage = "CONFIGURED_SERVER_INVALID"

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

    const result = await service.validateConfiguration({
      server_model_slug: input.server_model_slug,
      selected_components: input.selected_components,
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
