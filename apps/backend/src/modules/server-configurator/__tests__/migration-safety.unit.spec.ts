import fs from "node:fs"
import path from "node:path"
import { Migration20260720154041 } from "../migrations/Migration20260720154041"

describe("stage 03 migration safety", () => {
  const migration = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/modules/server-configurator/migrations/Migration20260720154041.ts"
    ),
    "utf8"
  )
  const up = migration.slice(
    migration.indexOf("override async up"),
    migration.indexOf("override async down")
  )
  const registryModeMigration = fs.readFileSync(
    path.join(
      process.cwd(),
      "src/modules/server-configurator/migrations/Migration20260720155527.ts"
    ),
    "utf8"
  )

  it("does not recreate or drop populated legacy pack tables", () => {
    expect(up).not.toContain('create table if not exists "component_pack"')
    expect(up).not.toContain('create table if not exists "component_pack_item"')
    expect(up).not.toContain('drop table if exists "component_pack"')
    expect(up).not.toContain('drop table if exists "component_pack_item"')
  })

  it("copies legacy specs without deleting the compatibility column", () => {
    expect(up).toContain('"normalized_specs_json" = coalesce("normalized_specs_json", "specs_json"')
    expect(up).toContain('"raw_specs_json" = coalesce("raw_specs_json", "specs_json"')
    expect(up).not.toContain('drop column if exists "specs_json"')
  })

  it("indexes legacy and canonical foreign-key columns", () => {
    expect(up).toContain('"IDX_component_pack_item_pack"')
    expect(up).toContain('"IDX_pack_assignment_pack"')
    expect(up).toContain('"IDX_property_value_definition"')
    expect(up).toContain('"IDX_technology_relation_type"')
  })

  it("renders executable up and down SQL plans without a database driver", async () => {
    const instance = Object.create(Migration20260720154041.prototype) as Migration20260720154041 & {
      addSql: (sql: string) => void
    }
    const statements: string[] = []
    instance.addSql = (sql) => statements.push(sql)

    await instance.up()
    const upCount = statements.length
    expect(upCount).toBeGreaterThan(100)
    expect(statements.some((sql) => sql.includes("legacy_specs_json_v1"))).toBe(true)

    statements.length = 0
    await instance.down()
    expect(statements.length).toBeGreaterThan(20)
    expect(statements.some((sql) => sql.includes('drop column if exists "normalized_specs_json"'))).toBe(true)
  })

  it("adds registry compatibility mode without destructive table changes", () => {
    expect(registryModeMigration).toContain('add column if not exists "compatibility_mode"')
    expect(registryModeMigration).toContain("where \"key\" in ('license', 'service')")
    expect(registryModeMigration).not.toContain("drop table")
  })
})
