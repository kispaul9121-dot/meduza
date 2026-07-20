import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolveCommercePrice } from "../commerce-pricing"
import {
  AddConfiguredServerToCartInput,
  ConfiguredServerPriceResult,
  ConfiguredServerValidationResult,
} from "../types"

export const calculateConfigurationPriceStep = createStep(
  "calculate-configured-server-cart-price",
  async (input: {
    request: AddConfiguredServerToCartInput
    validation: ConfiguredServerValidationResult
  }, { container }) => {
    const result: ConfiguredServerPriceResult = await resolveCommercePrice({
      container,
      request: input.request,
      validation: input.validation,
    })
    if (result.pricing_mode === "calculated" && result.availability_errors.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `CONFIGURED_SERVER_COMMERCE_INVALID: ${result.availability_errors.join(" ")}`
      )
    }

    return new StepResponse(result)
  }
)
