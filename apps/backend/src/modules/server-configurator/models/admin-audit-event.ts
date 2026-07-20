import { model } from "@medusajs/framework/utils"

const AdminAuditEvent = model.define("server_configurator_admin_audit_event", {
  id: model.id().primaryKey(),
  actor_id: model.text(),
  action: model.enum(["create", "update", "delete", "apply", "autosave", "approve"]),
  entity_type: model.text(),
  entity_id: model.text().nullable(),
  before_json: model.json().nullable(),
  after_json: model.json().nullable(),
  context_json: model.json().nullable(),
})

export default AdminAuditEvent
