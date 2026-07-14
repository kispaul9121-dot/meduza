import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260713170000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "component_pack" ("id" text not null, "name" text not null, "slug" text not null, "description" text null, "component_type" text check ("component_type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'rails', 'cable', 'cooling', 'license', 'service')) not null, "brand_scope" text[] null, "family_scope" text[] null, "generation_scope" text[] null, "chassis_scope" text[] null, "tags_json" jsonb null, "applicability_template_json" jsonb null, "enabled" boolean not null default true, "source_doc_reference" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "component_pack_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_deleted_at" ON "component_pack" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_slug" ON "component_pack" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_component_type" ON "component_pack" ("component_type") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "component_pack_item" ("id" text not null, "component_pack_id" text not null, "component_id" text not null, "sort_order" integer not null default 100, "enabled" boolean not null default true, "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "component_pack_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_item_deleted_at" ON "component_pack_item" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_item_pack" ON "component_pack_item" ("component_pack_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_item_component" ON "component_pack_item" ("component_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "component_pack_item" cascade;`);
    this.addSql(`drop table if exists "component_pack" cascade;`);
  }

}
