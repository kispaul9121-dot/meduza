import { model } from "@medusajs/framework/utils"

const Configuration = model.define("configuration", {
  id: model.id().primaryKey(),
  server_model_id: model.text(),
  medusa_cart_id: model.text().nullable(),
  medusa_line_item_id: model.text().nullable(),
  status: model.enum(["draft", "valid", "invalid", "ordered"]).default("draft"),
  total_price: model.float().default(0),
  effective_specs_json: model.json().nullable(),
  warnings_json: model.json().nullable(),
  errors_json: model.json().nullable(),
  snapshot_json: model.json().nullable(),
  hash: model.text().nullable(),
})

export default Configuration
