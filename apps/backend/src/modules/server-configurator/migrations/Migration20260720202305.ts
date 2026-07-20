import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720202305 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ready_configuration" drop constraint if exists "ready_configuration_slug_unique";`);
    this.addSql(`create table if not exists "ready_configuration" ("id" text not null, "slug" text not null, "name" text not null, "description" text null, "use_case" text not null, "server_model_id" text not null, "status" text check ("status" in ('draft', 'published', 'unpublished', 'archived')) not null default 'draft', "price_mode" text check ("price_mode" in ('fixed', 'from', 'request_quote')) not null default 'request_quote', "currency_code" text null, "base_price" real null, "components_price" real null, "total_price" real null, "featured" boolean not null default false, "sort_order" integer not null default 100, "media_json" jsonb null, "seo_title" text null, "seo_description" text null, "source_json" jsonb null, "review_json" jsonb null, "current_version" integer not null default 0, "published_version" integer null, "stale" boolean not null default false, "stale_reasons_json" jsonb null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ready_configuration_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ready_configuration_slug_unique" ON "ready_configuration" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ready_configuration_deleted_at" ON "ready_configuration" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ready_configuration_version" ("id" text not null, "ready_configuration_id" text not null, "version" integer not null, "status" text check ("status" in ('draft', 'valid', 'invalid', 'published', 'archived')) not null default 'draft', "snapshot_json" jsonb not null, "snapshot_hash" text not null, "engine_version" text not null, "relation_graph_hash" text not null, "property_schema_hash" text not null, "pack_assignment_hash" text not null, "dependency_hash" text not null, "validation_trace_json" jsonb not null, "validation_errors_json" jsonb not null, "validation_warnings_json" jsonb not null, "created_from" text check ("created_from" in ('manual', 'simulator', 'user_configuration', 'duplicate', 'revalidation')) not null default 'manual', "source_configuration_id" text null, "immutable" boolean not null default true, "published_at" timestamptz null, "archived_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ready_configuration_version_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ready_configuration_version_deleted_at" ON "ready_configuration_version" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ready_configuration" cascade;`);

    this.addSql(`drop table if exists "ready_configuration_version" cascade;`);
  }

}
