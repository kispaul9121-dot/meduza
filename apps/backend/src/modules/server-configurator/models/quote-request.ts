import { model } from "@medusajs/framework/utils"

const QuoteRequest = model.define("quote_request", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  medusa_cart_id: model.text().nullable(),
  medusa_customer_id: model.text().nullable(),
  medusa_order_id: model.text().nullable(),
  status: model.enum([
    "requested",
    "reviewing",
    "quoted",
    "accepted",
    "rejected",
    "expired",
    "converted",
  ]).default("requested"),
  company_name: model.text(),
  contact_name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  quantity: model.number().default(1),
  comments: model.text().nullable(),
  currency_code: model.text().nullable(),
  quoted_amount: model.bigNumber().nullable(),
  quoted_at: model.dateTime().nullable(),
  quote_expires_at: model.dateTime().nullable(),
  request_snapshot_json: model.json(),
  request_hash: model.text(),
})

export default QuoteRequest
