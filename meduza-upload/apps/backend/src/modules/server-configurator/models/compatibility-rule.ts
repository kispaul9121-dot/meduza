import { model } from "@medusajs/framework/utils"

const CompatibilityRule = model.define("compatibility_rule", {
  id: model.id().primaryKey(),
  name: model.text(),
  enabled: model.boolean().default(true),
  priority: model.number().default(100),
  scope_type: model.enum([
    "global",
    "brand",
    "generation",
    "family",
    "server_model",
    "chassis_variant",
    "component",
  ]),
  scope_value: model.text().nullable(),
  category: model.enum([
    "cpu",
    "ram",
    "storage",
    "raid",
    "nic",
    "psu",
    "riser",
    "cooling",
    "backplane",
  ]),
  rule_type: model.enum([
    "allow",
    "block",
    "require",
    "limit",
    "warning",
    "downgrade",
    "auto_add",
    "price_rule",
  ]),
  conditions_json: model.json().nullable(),
  action_json: model.json().nullable(),
  message: model.text().nullable(),
  admin_note: model.text().nullable(),
  source_doc_reference: model.text().nullable(),
  version: model.text().default("1"),
})

export default CompatibilityRule
