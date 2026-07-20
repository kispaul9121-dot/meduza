import { model } from "@medusajs/framework/utils"

const Component = model.define("component", {
  id: model.id().primaryKey(),
  type: model.enum([
    "cpu",
    "ram",
    "drive",
    "raid",
    "nic",
    "psu",
    "riser",
    "backplane",
    "rails",
    "cable",
    "cooling",
    "license",
    "service",
  ]),
  brand: model.text(),
  model: model.text(),
  part_number: model.text().nullable(),
  public_name: model.text(),
  short_name: model.text(),
  specs_json: model.json().nullable(),
  price: model.float().default(0),
  cost: model.float().default(0),
  stock_qty: model.number().default(0),
  medusa_product_variant_id: model.text().nullable(),
  enabled: model.boolean().default(true),
})

export default Component
