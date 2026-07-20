import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720164322 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "server_configurator_admin_audit_event" ("id" text not null, "actor_id" text not null, "action" text check ("action" in ('create', 'update', 'delete', 'apply', 'autosave', 'approve')) not null, "entity_type" text not null, "entity_id" text null, "before_json" jsonb null, "after_json" jsonb null, "context_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_configurator_admin_audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_admin_audit_event_deleted_at" ON "server_configurator_admin_audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_admin_audit_event_actor" ON "server_configurator_admin_audit_event" ("actor_id", "created_at" DESC) WHERE "deleted_at" IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_configurator_admin_audit_event_entity" ON "server_configurator_admin_audit_event" ("entity_type", "entity_id", "created_at" DESC) WHERE "deleted_at" IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "server_configurator_admin_audit_event" cascade;`);
  }

}
