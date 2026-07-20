import { model } from "@medusajs/framework/utils"

const ComponentPack = model.define("component_pack", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text(),
  description: model.text().nullable(),
  component_type: model.enum([
    "cpu",
    "ram",
    "drive",
    "raid",
    "nic",
    "psu",
    "riser",
    "backplane",
    "drive_cage",
    "boot_storage",
    "accelerator",
    "rails",
    "cable",
    "cooling",
    "license",
    "service",
  ]),
  brand_scope: model.array().nullable(),
  family_scope: model.array().nullable(),
  generation_scope: model.array().nullable(),
  chassis_scope: model.array().nullable(),
  tags_json: model.json().nullable(),
  applicability_template_json: model.json().nullable(),
  pack_kind: model.enum([
    "candidate_pool",
    "assembly_bundle",
    "platform_template",
  ]).default("candidate_pool"),
  defaults_json: model.json().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
  source_doc_reference: model.text().nullable(),
})

export default ComponentPack
