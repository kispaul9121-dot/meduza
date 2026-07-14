import { model } from "@medusajs/framework/utils"

const RulePreset = model.define("rule_preset", {
  id: model.id().primaryKey(),
  name: model.text(),
  category: model.text(),
  description: model.text().nullable(),
  conditions_template_json: model.json().nullable(),
  action_template_json: model.json().nullable(),
  enabled: model.boolean().default(true),
})

export default RulePreset
