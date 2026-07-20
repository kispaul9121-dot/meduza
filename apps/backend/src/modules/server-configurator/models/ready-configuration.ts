import { model } from "@medusajs/framework/utils"

const ReadyConfiguration = model.define("ready_configuration", {
  id: model.id().primaryKey(),
  slug: model.text().unique(),
  name: model.text(),
  description: model.text().nullable(),
  use_case: model.text(),
  server_model_id: model.text(),
  status: model.enum(["draft", "published", "unpublished", "archived"]).default("draft"),
  price_mode: model.enum(["fixed", "from", "request_quote"]).default("request_quote"),
  currency_code: model.text().nullable(),
  base_price: model.float().nullable(),
  components_price: model.float().nullable(),
  total_price: model.float().nullable(),
  featured: model.boolean().default(false),
  sort_order: model.number().default(100),
  media_json: model.json().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  source_json: model.json().nullable(),
  review_json: model.json().nullable(),
  current_version: model.number().default(0),
  published_version: model.number().nullable(),
  stale: model.boolean().default(false),
  stale_reasons_json: model.json().nullable(),
  published_at: model.dateTime().nullable(),
})

export default ReadyConfiguration
