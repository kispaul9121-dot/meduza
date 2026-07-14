import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260710134720 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "compatibility_rule" ("id" text not null, "name" text not null, "enabled" boolean not null default true, "priority" integer not null default 100, "scope_type" text check ("scope_type" in ('global', 'brand', 'generation', 'family', 'server_model', 'chassis_variant', 'component')) not null, "scope_value" text null, "category" text check ("category" in ('cpu', 'ram', 'storage', 'raid', 'nic', 'psu', 'riser', 'cooling', 'backplane')) not null, "rule_type" text check ("rule_type" in ('allow', 'block', 'require', 'limit', 'warning', 'downgrade', 'auto_add', 'price_rule')) not null, "conditions_json" jsonb null, "action_json" jsonb null, "message" text null, "admin_note" text null, "source_doc_reference" text null, "version" text not null default '1', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "compatibility_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_compatibility_rule_deleted_at" ON "compatibility_rule" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "component" ("id" text not null, "type" text check ("type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'rails', 'cable', 'cooling', 'license', 'service')) not null, "brand" text not null, "model" text not null, "part_number" text null, "public_name" text not null, "short_name" text not null, "specs_json" jsonb null, "price" real not null default 0, "cost" real not null default 0, "stock_qty" integer not null default 0, "medusa_product_variant_id" text null, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "component_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_deleted_at" ON "component" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "configuration" ("id" text not null, "server_model_id" text not null, "medusa_cart_id" text null, "medusa_line_item_id" text null, "status" text check ("status" in ('draft', 'valid', 'invalid', 'ordered')) not null default 'draft', "total_price" real not null default 0, "effective_specs_json" jsonb null, "warnings_json" jsonb null, "errors_json" jsonb null, "snapshot_json" jsonb null, "hash" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configuration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configuration_deleted_at" ON "configuration" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "configuration_item" ("id" text not null, "configuration_id" text not null, "component_id" text not null, "type" text not null, "quantity" integer not null default 1, "unit_price" real not null default 0, "total_price" real not null default 0, "snapshot_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configuration_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configuration_item_deleted_at" ON "configuration_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "rule_preset" ("id" text not null, "name" text not null, "category" text not null, "description" text null, "conditions_template_json" jsonb null, "action_template_json" jsonb null, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "rule_preset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_rule_preset_deleted_at" ON "rule_preset" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_model" ("id" text not null, "medusa_product_id" text null, "medusa_variant_id" text null, "brand" text not null, "family" text not null, "generation" text not null, "model" text not null, "public_name" text not null, "slug" text not null, "form_factor" text not null, "chassis_type" text not null, "drive_bays_front" integer not null, "drive_bays_rear" integer not null default 0, "drive_form_factor" text not null, "supported_drive_interfaces" text[] null, "front_option_type" text null, "backplane_type" text not null, "cpu_socket" text not null, "max_cpu" integer not null, "ram_slots_total" integer not null, "ram_slots_per_cpu" integer not null, "max_ram_capacity" text not null, "supported_ram_types" text[] null, "supported_ram_speeds" text[] null, "psu_type" text not null, "cooling_profile" text not null, "seo_title" text not null, "seo_description" text not null, "source_doc_reference" text not null, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_deleted_at" ON "server_model" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "compatibility_rule" cascade;`);

    this.addSql(`drop table if exists "component" cascade;`);

    this.addSql(`drop table if exists "configuration" cascade;`);

    this.addSql(`drop table if exists "configuration_item" cascade;`);

    this.addSql(`drop table if exists "rule_preset" cascade;`);

    this.addSql(`drop table if exists "server_model" cascade;`);
  }

}
