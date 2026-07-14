import { model } from "@medusajs/framework/utils"

const HelpAnnotation = model.define("help_annotation", {
  id: model.id().primaryKey(),
  key: model.text(),
  page: model.text(),
  target_type: model.text(),
  component_type: model.text().nullable(),
  server_model_slug: model.text().nullable(),
  title: model.text(),
  body: model.text(),
  placement: model.text().default("top"),
  icon: model.text().default("info"),
  severity: model.text().default("info"),
  sort_order: model.number().default(100),
  enabled: model.boolean().default(true),
  source_doc_reference: model.text().nullable(),
  metadata_json: model.json().nullable(),
})

export default HelpAnnotation
