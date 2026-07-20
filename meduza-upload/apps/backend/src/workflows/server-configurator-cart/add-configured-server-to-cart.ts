import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addBaseVariantToCartStep } from "./steps/add-base-variant-to-cart-step"
import { attachConfigurationMetadataStep } from "./steps/attach-configuration-metadata-step"
import { calculateConfigurationPriceStep } from "./steps/calculate-configuration-price-step"
import { saveConfigurationStep } from "./steps/save-configuration-step"
import { validateConfigurationStep } from "./steps/validate-configuration-step"
import { AddConfiguredServerToCartInput } from "./types"

export const addConfiguredServerToCartWorkflow = createWorkflow(
  "add-configured-server-to-cart",
  function (input: AddConfiguredServerToCartInput) {
    const validation = validateConfigurationStep(input)
    const pricing = calculateConfigurationPriceStep({ request: input, validation })
    const saved = saveConfigurationStep({ request: input, validation, pricing })
    const added = addBaseVariantToCartStep({ request: input, validation, pricing, saved })
    const result = attachConfigurationMetadataStep({ validation, pricing, saved, added })

    return new WorkflowResponse({
      cart: result.cart,
      configuration: result.configuration,
      line_item: result.line_item,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      effective_specs: validation.effective_specs,
    })
  }
)
