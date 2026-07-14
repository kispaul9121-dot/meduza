import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addConfiguredServerToCartWorkflow } from "../../../../workflows/server-configurator-cart/add-configured-server-to-cart"
import { AddConfiguredServerToCartSchemaType } from "../validators"
import { invalidConfiguredServerMessage } from "../../../../workflows/server-configurator-cart/steps/validate-configuration-step"

export async function POST(
  req: MedusaRequest<AddConfiguredServerToCartSchemaType>,
  res: MedusaResponse
) {
  try {
    const { result } = await addConfiguredServerToCartWorkflow(req.scope).run({
      input: req.validatedBody,
    })

    res.status(201).json(result)
    return
  } catch (error) {
    const validation = (error as any).validationResult

    if (validation || (error as Error).message === invalidConfiguredServerMessage) {
      res.status(422).json({
        cart: null,
        configuration: null,
        line_item: null,
        valid: false,
        errors: validation?.errors || ["Configuration is invalid."],
        warnings: validation?.warnings || [],
        effective_specs: validation?.effective_specs || {},
      })
      return
    }

    throw error
  }
}
