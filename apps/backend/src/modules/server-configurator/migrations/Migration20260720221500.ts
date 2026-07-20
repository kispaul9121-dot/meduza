import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260720221500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_server_model_enabled_name" ON "server_model" ("enabled", "public_name", "slug") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_server_model_brand_family" ON "server_model" ("brand", "family", "generation") WHERE "deleted_at" IS NULL AND "enabled" = true;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_server_model_chassis" ON "server_model" ("form_factor", "chassis_type", "cpu_socket") WHERE "deleted_at" IS NULL AND "enabled" = true;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_property_definition_filterable" ON "property_definition" ("filterable", "lifecycle_status", "usage_status", "key") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_property_assignment_scope" ON "property_assignment" ("owner_id", "owner_type", "property_definition_id") WHERE "deleted_at" IS NULL AND "enabled" = true;`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_catalog_property_assignment_scope";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_catalog_property_definition_filterable";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_catalog_server_model_chassis";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_catalog_server_model_brand_family";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_catalog_server_model_enabled_name";`)
  }
}
