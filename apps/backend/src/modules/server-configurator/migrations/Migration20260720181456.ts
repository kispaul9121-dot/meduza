import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720181456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "server_configurator_import_staged_record" drop constraint if exists "server_configurator_import_staged_record_record_identity_unique";`);
    this.addSql(`alter table if exists "server_configurator_import_batch" drop constraint if exists "server_configurator_import_batch_file_identity_unique";`);
    this.addSql(`alter table if exists "server_configurator_import_apply_attempt" drop constraint if exists "server_configurator_import_apply_attempt_idempotency_key_unique";`);
    this.addSql(`create table if not exists "server_configurator_import_apply_attempt" ("id" text not null, "batch_id" text not null, "idempotency_key" text not null, "actor_id" text not null, "status" text check ("status" in ('started', 'applied', 'failed', 'rolled_back')) not null default 'started', "approved_groups_json" jsonb not null, "result_json" jsonb null, "rollback_json" jsonb null, "error_json" jsonb null, "applied_at" timestamptz null, "rolled_back_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_configurator_import_apply_attempt_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_server_configurator_import_apply_attempt_idempotency_key_unique" ON "server_configurator_import_apply_attempt" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_import_apply_attempt_deleted_at" ON "server_configurator_import_apply_attempt" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_configurator_import_batch" ("id" text not null, "source_type" text check ("source_type" in ('json', 'csv', 'document', 'genius_manifest')) not null, "adapter_key" text not null, "file_name" text null, "file_hash" text not null, "file_identity" text not null, "dry_run" boolean not null default true, "status" text check ("status" in ('extracted', 'normalized', 'in_review', 'dry_run_ready', 'applying', 'applied', 'failed', 'rolled_back')) not null default 'extracted', "counts_json" jsonb not null, "warnings_json" jsonb null, "errors_json" jsonb null, "reviewer_id" text null, "review_status" text check ("review_status" in ('pending', 'approved', 'rejected')) not null default 'pending', "applied_at" timestamptz null, "rolled_back_at" timestamptz null, "rollback_reference" text null, "source_schema_version" integer not null default 1, "target_schema_version" integer not null default 1, "actor_id" text not null, "creation_manifest_id" text null, "wizard_session_id" text null, "bootstrap_proposal_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_configurator_import_batch_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_server_configurator_import_batch_file_identity_unique" ON "server_configurator_import_batch" ("file_identity") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_import_batch_deleted_at" ON "server_configurator_import_batch" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_configurator_import_staged_record" ("id" text not null, "batch_id" text not null, "sequence" integer not null, "record_identity" text not null, "source_identity" text not null, "stable_key" text not null, "object_class" text not null, "raw_payload_json" jsonb not null, "normalized_payload_json" jsonb null, "mapping_suggestions_json" jsonb null, "classification_proposal" text not null, "classification_confirmed" text null, "action" text check ("action" in ('create', 'update', 'unchanged', 'archive', 'block')) not null, "existing_entity_id" text null, "diff_json" jsonb null, "warnings_json" jsonb null, "errors_json" jsonb null, "source_evidence_json" jsonb null, "confidence" real null, "review_status" text check ("review_status" in ('suggested', 'approved', 'edited', 'rejected', 'unresolved')) not null default 'suggested', "apply_status" text check ("apply_status" in ('pending', 'applied', 'skipped', 'failed', 'rolled_back')) not null default 'pending', "applied_entity_type" text null, "applied_entity_id" text null, "before_json" jsonb null, "after_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_configurator_import_staged_record_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_server_configurator_import_staged_record_record_identity_unique" ON "server_configurator_import_staged_record" ("record_identity") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_import_staged_record_deleted_at" ON "server_configurator_import_staged_record" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_batch_status_created" ON "server_configurator_import_batch" ("status", "created_at") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_batch_actor_review" ON "server_configurator_import_batch" ("actor_id", "review_status", "created_at") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_batch_manifest" ON "server_configurator_import_batch" ("creation_manifest_id") WHERE "deleted_at" IS NULL AND "creation_manifest_id" IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_staged_batch_sequence" ON "server_configurator_import_staged_record" ("batch_id", "sequence") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_staged_batch_review_action" ON "server_configurator_import_staged_record" ("batch_id", "review_status", "action") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_staged_stable_key" ON "server_configurator_import_staged_record" ("stable_key") WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_import_attempt_batch_status" ON "server_configurator_import_apply_attempt" ("batch_id", "status", "created_at") WHERE "deleted_at" IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "server_configurator_import_apply_attempt" cascade;`);

    this.addSql(`drop table if exists "server_configurator_import_batch" cascade;`);

    this.addSql(`drop table if exists "server_configurator_import_staged_record" cascade;`);
  }

}
