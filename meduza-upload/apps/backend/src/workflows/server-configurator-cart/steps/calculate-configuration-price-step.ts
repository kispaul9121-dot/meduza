import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
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
  }) => {
    const totalPrice = Number(input.validation.total_price || 0)
    const requestQuote =
      input.request.pricing_mode === "request_quote" || totalPrice <= 0

    const result: ConfiguredServerPriceResult = {
      total_price: requestQuote ? 0 : totalPrice,
      pricing_mode: requestQuote ? "request_quote" : "calculated",
      request_quote: requestQuote,
    }

    return new StepResponse(result)
  }
)
