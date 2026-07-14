import { model } from "@medusajs/framework/utils"

const ComponentPackItem = model.define("component_pack_item", {
  id: model.id().primaryKey(),
  component_pack_id: model.text(),
  component_id: model.text(),
  sort_order: model.number().default(100),
  enabled: model.boolean().default(true),
  note: model.text().nullable(),
})

export default ComponentPackItem
