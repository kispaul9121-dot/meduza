import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720223000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "quote_request" ("id" text not null, "configuration_id" text not null, "medusa_cart_id" text null, "medusa_customer_id" text null, "medusa_order_id" text null, "status" text check ("status" in ('requested', 'reviewing', 'quoted', 'accepted', 'rejected', 'expired', 'converted')) not null default 'requested', "company_name" text not null, "contact_name" text not null, "email" text not null, "phone" text null, "quantity" integer not null default 1, "comments" text null, "currency_code" text null, "quoted_amount" numeric null, "quoted_at" timestamptz null, "quote_expires_at" timestamptz null, "request_snapshot_json" jsonb not null, "request_hash" text not null, "raw_quoted_amount" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "quote_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quote_request_deleted_at" ON "quote_request" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quote_request_configuration" ON "quote_request" ("configuration_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quote_request_customer" ON "quote_request" ("medusa_customer_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "configuration" drop constraint if exists "configuration_status_check";`);

    this.addSql(`alter table if exists "configuration" add column if not exists "medusa_customer_id" text null, add column if not exists "medusa_order_id" text null, add column if not exists "price_mode" text check ("price_mode" in ('calculated', 'request_quote')) not null default 'request_quote', add column if not exists "currency_code" text null, add column if not exists "priced_at" timestamptz null, add column if not exists "price_expires_at" timestamptz null, add column if not exists "ready_configuration_id" text null, add column if not exists "ready_configuration_version" integer null, add column if not exists "ready_snapshot_hash" text null, add column if not exists "storage_option_id" text null, add column if not exists "explicit_none_json" jsonb null, add column if not exists "order_snapshot_json" jsonb null, add column if not exists "order_snapshot_hash" text null, add column if not exists "ordered_at" timestamptz null, add column if not exists "raw_total_price" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "configuration" alter column "total_price" type numeric using ("total_price"::numeric);`);
    this.addSql(`update "configuration" set "raw_total_price" = jsonb_build_object('value', "total_price"::text, 'precision', 20);`);
    this.addSql(`alter table if exists "configuration" add constraint "configuration_status_check" check("status" in ('draft', 'valid', 'invalid', 'in_cart', 'quote_requested', 'quoted', 'ordered', 'expired', 'archived'));`);

    this.addSql(`alter table if exists "configuration_item" add column if not exists "currency_code" text null, add column if not exists "price_source" text null, add column if not exists "medusa_variant_id" text null, add column if not exists "raw_unit_price" jsonb not null default '{"value":"0","precision":20}', add column if not exists "raw_total_price" jsonb not null default '{"value":"0","precision":20}';`);
    this.addSql(`alter table if exists "configuration_item" alter column "unit_price" type numeric using ("unit_price"::numeric);`);
    this.addSql(`alter table if exists "configuration_item" alter column "total_price" type numeric using ("total_price"::numeric);`);
    this.addSql(`update "configuration_item" set "raw_unit_price" = jsonb_build_object('value', "unit_price"::text, 'precision', 20), "raw_total_price" = jsonb_build_object('value', "total_price"::text, 'precision', 20);`);
    this.addSql(`create or replace function prevent_quote_request_snapshot_mutation() returns trigger as $$ begin if old.request_hash is distinct from new.request_hash or old.request_snapshot_json is distinct from new.request_snapshot_json or old.configuration_id is distinct from new.configuration_id or old.medusa_cart_id is distinct from new.medusa_cart_id or old.medusa_customer_id is distinct from new.medusa_customer_id or old.company_name is distinct from new.company_name or old.contact_name is distinct from new.contact_name or old.email is distinct from new.email or old.phone is distinct from new.phone or old.quantity is distinct from new.quantity or old.comments is distinct from new.comments or old.currency_code is distinct from new.currency_code then raise exception 'RFQ request snapshot and identity are immutable'; end if; return new; end; $$ language plpgsql;`);
    this.addSql(`drop trigger if exists quote_request_snapshot_immutable on "quote_request";`);
    this.addSql(`create trigger quote_request_snapshot_immutable before update on "quote_request" for each row execute function prevent_quote_request_snapshot_mutation();`);
    this.addSql(`create or replace function prevent_configuration_order_snapshot_mutation() returns trigger as $$ begin if old.order_snapshot_hash is not null and (old.order_snapshot_hash is distinct from new.order_snapshot_hash or old.order_snapshot_json is distinct from new.order_snapshot_json or old.medusa_order_id is distinct from new.medusa_order_id or old.ordered_at is distinct from new.ordered_at) then raise exception 'Configuration order snapshot is immutable'; end if; return new; end; $$ language plpgsql;`);
    this.addSql(`drop trigger if exists configuration_order_snapshot_immutable on "configuration";`);
    this.addSql(`create trigger configuration_order_snapshot_immutable before update on "configuration" for each row execute function prevent_configuration_order_snapshot_mutation();`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop trigger if exists quote_request_snapshot_immutable on "quote_request";`);
    this.addSql(`drop function if exists prevent_quote_request_snapshot_mutation();`);
    this.addSql(`drop trigger if exists configuration_order_snapshot_immutable on "configuration";`);
    this.addSql(`drop function if exists prevent_configuration_order_snapshot_mutation();`);
    this.addSql(`drop table if exists "quote_request" cascade;`);

    this.addSql(`alter table if exists "configuration" drop constraint if exists "configuration_status_check";`);

    this.addSql(`alter table if exists "configuration" drop column if exists "medusa_customer_id", drop column if exists "medusa_order_id", drop column if exists "price_mode", drop column if exists "currency_code", drop column if exists "priced_at", drop column if exists "price_expires_at", drop column if exists "ready_configuration_id", drop column if exists "ready_configuration_version", drop column if exists "ready_snapshot_hash", drop column if exists "storage_option_id", drop column if exists "explicit_none_json", drop column if exists "order_snapshot_json", drop column if exists "order_snapshot_hash", drop column if exists "ordered_at", drop column if exists "raw_total_price";`);

    this.addSql(`alter table if exists "configuration" alter column "total_price" type real using ("total_price"::real);`);
    this.addSql(`alter table if exists "configuration" add constraint "configuration_status_check" check("status" in ('draft', 'valid', 'invalid', 'ordered'));`);

    this.addSql(`alter table if exists "configuration_item" drop column if exists "currency_code", drop column if exists "price_source", drop column if exists "medusa_variant_id", drop column if exists "raw_unit_price", drop column if exists "raw_total_price";`);

    this.addSql(`alter table if exists "configuration_item" alter column "unit_price" type real using ("unit_price"::real);`);
    this.addSql(`alter table if exists "configuration_item" alter column "total_price" type real using ("total_price"::real);`);
  }

}
