import { model } from "@medusajs/framework/utils"

const ConfigurationItem = model.define("configuration_item", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  component_id: model.text(),
  type: model.text(),
  quantity: model.number().default(1),
  currency_code: model.text().nullable(),
  unit_price: model.bigNumber().default(0),
  total_price: model.bigNumber().default(0),
  price_source: model.text().nullable(),
  medusa_variant_id: model.text().nullable(),
  snapshot_json: model.json().nullable(),
})

export default ConfigurationItem
