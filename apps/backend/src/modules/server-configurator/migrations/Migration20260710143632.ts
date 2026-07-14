import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260710143632 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "help_annotation" ("id" text not null, "key" text not null, "page" text not null, "target_type" text not null, "component_type" text null, "server_model_slug" text null, "title" text not null, "body" text not null, "placement" text not null default 'top', "icon" text not null default 'info', "severity" text not null default 'info', "sort_order" integer not null default 100, "enabled" boolean not null default true, "source_doc_reference" text null, "metadata_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "help_annotation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_help_annotation_deleted_at" ON "help_annotation" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "help_annotation" cascade;`);
  }

}
