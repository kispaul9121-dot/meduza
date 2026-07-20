import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720155527 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "component_type_definition" add column if not exists "compatibility_mode" text check ("compatibility_mode" in ('validated', 'informational')) not null default 'validated';`);
    this.addSql(`update "component_type_definition" set "compatibility_mode" = 'informational' where "key" in ('license', 'service') and "validator_key" is null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "component_type_definition" drop column if exists "compatibility_mode";`);
  }

}
