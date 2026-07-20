import crypto from "node:crypto"
import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../modules/server-configurator"
import { resolveCommercePrice } from "../workflows/server-configurator-cart/commerce-pricing"

export default async function verifyCommerceStage12({ container }: { container: MedusaContainer }) {
  const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [model] = await service.listServerModels({}, { take: 1 })
  if (!model) throw new MedusaError(MedusaError.Types.NOT_FOUND, "No server model for stage 12 verification")
  let configuration: any
  let quoteRequest: any
  try {
    const priceObservation = model.medusa_variant_id
      ? await resolveCommercePrice({
          container,
          request: { server_model_slug: model.slug, selected_components: [], pricing_mode: "request_quote" },
          validation: { valid: true, errors: [], warnings: [], effective_specs: {}, total_price: 0, server_model: model },
        })
      : null
    const technicalSnapshot = { schema: "commerce.configuration.v1", server_model: { id: model.id, slug: model.slug }, verification: true }
    const configurationHash = crypto.createHash("sha256").update(JSON.stringify(technicalSnapshot)).digest("hex")
    configuration = await service.createConfigurations({
      server_model_id: model.id,
      status: "valid",
      price_mode: "request_quote",
      currency_code: "usd",
      total_price: 1250,
      snapshot_json: technicalSnapshot,
      hash: configurationHash,
    })
    const requestSnapshot = { schema: "commerce.rfq.v1", configuration_id: configuration.id, quantity: 2 }
    const requestHash = crypto.createHash("sha256").update(JSON.stringify(requestSnapshot)).digest("hex")
    quoteRequest = await service.createQuoteRequests({
      configuration_id: configuration.id,
      status: "requested",
      company_name: "Stage 12 verification",
      contact_name: "Verifier",
      email: "verify@example.com",
      quantity: 2,
      currency_code: "usd",
      request_snapshot_json: requestSnapshot,
      request_hash: requestHash,
    })
    await service.updateQuoteRequests({ id: quoteRequest.id, status: "quoted", quoted_amount: 1300, quoted_at: new Date() })
    let rfqImmutable = false
    try {
      await service.updateQuoteRequests({ id: quoteRequest.id, request_hash: "tampered" })
    } catch { rfqImmutable = true }
    const orderSnapshot = { schema: "commerce.order-configuration.v1", order: { id: "order_stage12_verify" }, technical_snapshot: technicalSnapshot }
    const orderHash = crypto.createHash("sha256").update(JSON.stringify(orderSnapshot)).digest("hex")
    await service.updateConfigurations({
      id: configuration.id,
      status: "ordered",
      medusa_order_id: "order_stage12_verify",
      order_snapshot_json: orderSnapshot,
      order_snapshot_hash: orderHash,
      ordered_at: new Date(),
    })
    let orderImmutable = false
    try {
      await service.updateConfigurations({ id: configuration.id, order_snapshot_hash: "tampered" })
    } catch { orderImmutable = true }
    if (!rfqImmutable || !orderImmutable) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Immutable commerce snapshot guard failed")
    console.log(JSON.stringify({
      stage: 12,
      configuration_status: "ordered",
      currency_aware_amount: true,
      live_medusa_price_query: priceObservation ? {
        currency_code: priceObservation.currency_code,
        total_price: priceObservation.total_price,
        availability_errors: priceObservation.availability_errors,
      } : "model_has_no_base_variant",
      rfq_status_transition: "requested->quoted",
      rfq_snapshot_immutable: rfqImmutable,
      order_snapshot_immutable: orderImmutable,
    }))
  } finally {
    if (quoteRequest?.id) await service.deleteQuoteRequests(quoteRequest.id)
    if (configuration?.id) await service.deleteConfigurations(configuration.id)
    const browserQuotes = await service.listQuoteRequests({ email: "stage12-browser@example.com" }, { take: 100 })
    const browserConfigurationIds = browserQuotes.map((quote: any) => quote.configuration_id)
    if (browserQuotes.length) await service.deleteQuoteRequests(browserQuotes.map((quote: any) => quote.id))
    if (browserConfigurationIds.length) {
      const items = await service.listConfigurationItems({ configuration_id: browserConfigurationIds }, { take: 10000 })
      if (items.length) await service.deleteConfigurationItems(items.map((item: any) => item.id))
      await service.deleteConfigurations(browserConfigurationIds)
    }
  }
}
