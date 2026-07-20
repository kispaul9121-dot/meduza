import { model } from "@medusajs/framework/utils";

export const ImportBatch = model.define("server_configurator_import_batch", {
  id: model.id().primaryKey(),
  source_type: model.enum(["json", "csv", "document", "genius_manifest"]),
  adapter_key: model.text(),
  file_name: model.text().nullable(),
  file_hash: model.text(),
  file_identity: model.text().unique(),
  dry_run: model.boolean().default(true),
  status: model
    .enum([
      "extracted",
      "normalized",
      "in_review",
      "dry_run_ready",
      "applying",
      "applied",
      "failed",
      "rolled_back",
    ])
    .default("extracted"),
  counts_json: model.json(),
  warnings_json: model.json().nullable(),
  errors_json: model.json().nullable(),
  reviewer_id: model.text().nullable(),
  review_status: model
    .enum(["pending", "approved", "rejected"])
    .default("pending"),
  applied_at: model.dateTime().nullable(),
  rolled_back_at: model.dateTime().nullable(),
  rollback_reference: model.text().nullable(),
  source_schema_version: model.number().default(1),
  target_schema_version: model.number().default(1),
  actor_id: model.text(),
  creation_manifest_id: model.text().nullable(),
  wizard_session_id: model.text().nullable(),
  bootstrap_proposal_json: model.json().nullable(),
});

export const ImportStagedRecord = model.define(
  "server_configurator_import_staged_record",
  {
    id: model.id().primaryKey(),
    batch_id: model.text(),
    sequence: model.number(),
    record_identity: model.text().unique(),
    source_identity: model.text(),
    stable_key: model.text(),
    object_class: model.text(),
    raw_payload_json: model.json(),
    normalized_payload_json: model.json().nullable(),
    mapping_suggestions_json: model.json().nullable(),
    classification_proposal: model.text(),
    classification_confirmed: model.text().nullable(),
    action: model.enum(["create", "update", "unchanged", "archive", "block"]),
    existing_entity_id: model.text().nullable(),
    diff_json: model.json().nullable(),
    warnings_json: model.json().nullable(),
    errors_json: model.json().nullable(),
    source_evidence_json: model.json().nullable(),
    confidence: model.float().nullable(),
    review_status: model
      .enum(["suggested", "approved", "edited", "rejected", "unresolved"])
      .default("suggested"),
    apply_status: model
      .enum(["pending", "applied", "skipped", "failed", "rolled_back"])
      .default("pending"),
    applied_entity_type: model.text().nullable(),
    applied_entity_id: model.text().nullable(),
    before_json: model.json().nullable(),
    after_json: model.json().nullable(),
  },
);

export const ImportApplyAttempt = model.define(
  "server_configurator_import_apply_attempt",
  {
    id: model.id().primaryKey(),
    batch_id: model.text(),
    idempotency_key: model.text().unique(),
    actor_id: model.text(),
    status: model
      .enum(["started", "applied", "failed", "rolled_back"])
      .default("started"),
    approved_groups_json: model.json(),
    result_json: model.json().nullable(),
    rollback_json: model.json().nullable(),
    error_json: model.json().nullable(),
    applied_at: model.dateTime().nullable(),
    rolled_back_at: model.dateTime().nullable(),
  },
);
