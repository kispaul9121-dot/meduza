import crypto from "node:crypto"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../modules/server-configurator"
import { calculateConfigurationPriceStep } from "./steps/calculate-configuration-price-step"
import { saveConfigurationStep } from "./steps/save-configuration-step"
import { validateConfigurationStep } from "./steps/validate-configuration-step"
import type { AddConfiguredServerToCartInput, ConfiguredServerPriceResult, SavedConfiguredServer } from "./types"

export type RequestConfigurationQuoteInput = AddConfiguredServerToCartInput & {
  company_name: string
  contact_name: string
  email: string
  phone?: string
  comments?: string
}

const createQuoteRequestStep = createStep(
  "create-quote-request",
  async (input: {
    request: RequestConfigurationQuoteInput
    pricing: ConfiguredServerPriceResult
    saved: SavedConfiguredServer
  }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const requestSnapshot = {
      schema: "commerce.rfq.v1",
      configuration_id: input.saved.configuration.id,
      configuration_hash: input.saved.configuration.hash,
      technical_snapshot: input.saved.snapshot,
      requested_quantity: input.request.quantity || 1,
      price_observation: {
        currency_code: input.pricing.currency_code,
        total_price: input.pricing.total_price,
        lines: input.pricing.lines,
        availability_errors: input.pricing.availability_errors,
        priced_at: input.pricing.priced_at,
        expires_at: input.pricing.price_expires_at,
      },
      contact: {
        company_name: input.request.company_name,
        contact_name: input.request.contact_name,
        email: input.request.email,
        phone: input.request.phone || null,
        comments: input.request.comments || null,
      },
    }
    const requestHash = crypto.createHash("sha256").update(JSON.stringify(requestSnapshot)).digest("hex")
    const quoteRequest = await service.createQuoteRequests({
      configuration_id: input.saved.configuration.id,
      medusa_cart_id: input.request.cart_id || null,
      medusa_customer_id: input.request.customer_id || null,
      status: "requested",
      company_name: input.request.company_name,
      contact_name: input.request.contact_name,
      email: input.request.email,
      phone: input.request.phone || null,
      quantity: input.request.quantity || 1,
      comments: input.request.comments || null,
      currency_code: input.pricing.currency_code,
      request_snapshot_json: requestSnapshot,
      request_hash: requestHash,
    })
    let configuration
    try {
      configuration = await service.updateConfigurations({
        id: input.saved.configuration.id,
        status: "quote_requested",
        medusa_cart_id: input.request.cart_id || null,
        medusa_customer_id: input.request.customer_id || null,
      })
    } catch (error) {
      await service.deleteQuoteRequests(quoteRequest.id)
      throw error
    }
    return new StepResponse({ quote_request: quoteRequest, configuration }, { quote_request_id: quoteRequest.id })
  },
  async (created, { container }) => {
    if (!created?.quote_request_id) return
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteQuoteRequests(created.quote_request_id)
  }
)

export const requestConfigurationQuoteWorkflow = createWorkflow(
  "request-configuration-quote",
  function (input: RequestConfigurationQuoteInput) {
    const validation = validateConfigurationStep(input)
    const pricing = calculateConfigurationPriceStep({ request: input, validation })
    const saved = saveConfigurationStep({ request: input, validation, pricing })
    const result = createQuoteRequestStep({ request: input, pricing, saved })
    return new WorkflowResponse({
      quote_request: result.quote_request,
      configuration: result.configuration,
      valid: validation.valid,
      warnings: validation.warnings,
      availability_warnings: pricing.availability_errors,
    })
  }
)
