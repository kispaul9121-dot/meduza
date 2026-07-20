import { model } from "@medusajs/framework/utils"

const ConfigurationItem = model.define("configuration_item", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  component_id: model.text(),
  type: model.text(),
  quantity: model.number().default(1),
  unit_price: model.float().default(0),
  total_price: model.float().default(0),
  snapshot_json: model.json().nullable(),
})

export default ConfigurationItem
