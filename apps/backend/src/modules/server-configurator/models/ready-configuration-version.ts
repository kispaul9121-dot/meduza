import { model } from "@medusajs/framework/utils"

const ReadyConfigurationVersion = model.define("ready_configuration_version", {
  id: model.id().primaryKey(),
  ready_configuration_id: model.text(),
  version: model.number(),
  status: model.enum(["draft", "valid", "invalid", "published", "archived"]).default("draft"),
  snapshot_json: model.json(),
  snapshot_hash: model.text(),
  engine_version: model.text(),
  relation_graph_hash: model.text(),
  property_schema_hash: model.text(),
  pack_assignment_hash: model.text(),
  dependency_hash: model.text(),
  validation_trace_json: model.json(),
  validation_errors_json: model.json(),
  validation_warnings_json: model.json(),
  created_from: model.enum(["manual", "simulator", "user_configuration", "duplicate", "revalidation"]).default("manual"),
  source_configuration_id: model.text().nullable(),
  immutable: model.boolean().default(true),
  published_at: model.dateTime().nullable(),
  archived_at: model.dateTime().nullable(),
})

export default ReadyConfigurationVersion
