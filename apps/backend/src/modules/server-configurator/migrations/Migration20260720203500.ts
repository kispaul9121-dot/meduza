import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260720203500 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ready_configuration_publication" ON "ready_configuration" ("status", "stale", "featured", "sort_order") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ready_configuration_model" ON "ready_configuration" ("server_model_id", "status") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ready_configuration_version_number_unique" ON "ready_configuration_version" ("ready_configuration_id", "version") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ready_configuration_version_publication" ON "ready_configuration_version" ("ready_configuration_id", "status", "version") WHERE "deleted_at" IS NULL;`)
    this.addSql(`CREATE OR REPLACE FUNCTION prevent_ready_configuration_snapshot_mutation() RETURNS trigger AS $$ BEGIN IF OLD.immutable = true AND (NEW.snapshot_json IS DISTINCT FROM OLD.snapshot_json OR NEW.snapshot_hash IS DISTINCT FROM OLD.snapshot_hash OR NEW.dependency_hash IS DISTINCT FROM OLD.dependency_hash OR NEW.version IS DISTINCT FROM OLD.version OR NEW.ready_configuration_id IS DISTINCT FROM OLD.ready_configuration_id) THEN RAISE EXCEPTION 'ReadyConfigurationVersion snapshots are immutable'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;`)
    this.addSql(`CREATE TRIGGER "TRG_ready_configuration_version_immutable" BEFORE UPDATE ON "ready_configuration_version" FOR EACH ROW EXECUTE FUNCTION prevent_ready_configuration_snapshot_mutation();`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TRIGGER IF EXISTS "TRG_ready_configuration_version_immutable" ON "ready_configuration_version";`)
    this.addSql(`DROP FUNCTION IF EXISTS prevent_ready_configuration_snapshot_mutation();`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_ready_configuration_version_publication";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_ready_configuration_version_number_unique";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_ready_configuration_model";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_ready_configuration_publication";`)
  }
}
