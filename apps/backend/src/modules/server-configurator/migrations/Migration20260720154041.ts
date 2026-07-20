import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260720154041 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vendor_generation_template" drop constraint if exists "vendor_generation_template_key_unique";`);
    this.addSql(`alter table if exists "technology_platform" drop constraint if exists "technology_platform_key_unique";`);
    this.addSql(`alter table if exists "technology_concept_type" drop constraint if exists "technology_concept_type_key_unique";`);
    this.addSql(`alter table if exists "technology_concept" drop constraint if exists "technology_concept_stable_key_unique";`);
    this.addSql(`alter table if exists "server_family" drop constraint if exists "server_family_key_unique";`);
    this.addSql(`alter table if exists "relation_type_definition" drop constraint if exists "relation_type_definition_key_unique";`);
    this.addSql(`alter table if exists "property_definition" drop constraint if exists "property_definition_key_unique";`);
    this.addSql(`alter table if exists "component_type_definition" drop constraint if exists "component_type_definition_key_unique";`);
    this.addSql(`alter table if exists "chassis_variant" drop constraint if exists "chassis_variant_key_unique";`);
    this.addSql(`create table if not exists "backplane_variant" ("id" text not null, "name" text not null, "supported_protocols" text[] not null, "connector_types" text[] not null, "connection_mode" text check ("connection_mode" in ('direct_attach', 'expander', 'hybrid')) not null, "max_protocol_bays_json" jsonb null, "lane_requirements_json" jsonb null, "required_controller_capabilities_json" jsonb null, "required_cables_json" jsonb null, "provides_json" jsonb null, "consumes_json" jsonb null, "conflicts_json" jsonb null, "source_doc_reference" text null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "backplane_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_backplane_variant_deleted_at" ON "backplane_variant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "capability_profile" ("id" text not null, "owner_type" text not null, "owner_id" text not null, "platform_json" jsonb not null, "cpu_json" jsonb not null, "memory_json" jsonb not null, "storage_json" jsonb not null, "expansion_json" jsonb not null, "network_json" jsonb not null, "accelerator_json" jsonb not null, "boot_storage_json" jsonb not null, "power_json" jsonb not null, "cooling_json" jsonb not null, "management_json" jsonb not null, "source_json" jsonb null, "schema_version" integer not null default 1, "review_status" text check ("review_status" in ('draft', 'verified', 'deprecated')) not null default 'draft', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "capability_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_capability_profile_deleted_at" ON "capability_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "chassis_variant" ("id" text not null, "key" text not null, "server_model_id" text not null, "name" text not null, "properties_json" jsonb null, "source_json" jsonb null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chassis_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chassis_variant_key_unique" ON "chassis_variant" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chassis_variant_deleted_at" ON "chassis_variant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "component_pack" drop constraint if exists "component_pack_component_type_check";`);
    this.addSql(`alter table if exists "component_pack" add column if not exists "pack_kind" text not null default 'candidate_pool', add column if not exists "defaults_json" jsonb null, add column if not exists "schema_version" integer not null default 1;`);
    this.addSql(`alter table if exists "component_pack" add constraint "component_pack_component_type_check" check("component_type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'drive_cage', 'boot_storage', 'accelerator', 'rails', 'cable', 'cooling', 'license', 'service'));`);
    this.addSql(`alter table if exists "component_pack" add constraint "component_pack_pack_kind_check" check("pack_kind" in ('candidate_pool', 'assembly_bundle', 'platform_template'));`);

    this.addSql(`create table if not exists "component_type_definition" ("id" text not null, "key" text not null, "name" text not null, "description" text null, "fields_schema_json" jsonb not null, "ui_schema_json" jsonb null, "facts_mapping_json" jsonb null, "validator_key" text null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "component_type_definition_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_component_type_definition_key_unique" ON "component_type_definition" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_type_definition_deleted_at" ON "component_type_definition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "concept_alias" ("id" text not null, "technology_concept_id" text not null, "alias" text not null, "normalized_alias" text not null, "source_json" jsonb null, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "concept_alias_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_concept_alias_deleted_at" ON "concept_alias" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "configurator_option_group" ("id" text not null, "key" text not null, "title" text not null, "scope_type" text check ("scope_type" in ('server_model', 'technology_platform', 'vendor_generation', 'server_family')) not null, "scope_id" text not null, "component_type" text not null, "source_types_json" jsonb not null, "selection_cardinality" text check ("selection_cardinality" in ('zero_or_one', 'exactly_one', 'zero_or_many', 'one_or_many')) not null, "allow_none" boolean not null default false, "none_label" text null, "none_selected_by_default" boolean not null default false, "min_quantity" integer not null default 0, "max_quantity" integer not null default 1, "sort_order" integer not null default 100, "advanced" boolean not null default false, "help_text" text null, "visibility_rules_json" jsonb null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "configurator_option_group_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_configurator_option_group_deleted_at" ON "configurator_option_group" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "creation_manifest" ("id" text not null, "wizard_session_id" text not null, "planned_creates_json" jsonb not null, "planned_updates_json" jsonb not null, "planned_links_json" jsonb not null, "planned_assignments_json" jsonb not null, "warnings_json" jsonb not null, "blockers_json" jsonb not null, "publication_actions_json" jsonb not null, "manifest_version" integer not null default 1, "status" text check ("status" in ('preview', 'confirmed', 'applied', 'superseded')) not null default 'preview', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creation_manifest_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creation_manifest_deleted_at" ON "creation_manifest" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "creation_wizard_session" ("id" text not null, "owner_id" text not null, "current_step" text not null, "draft_payload_json" jsonb not null, "mode_hint" text null, "status" text check ("status" in ('draft', 'ready', 'applying', 'completed', 'failed', 'abandoned')) not null default 'draft', "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "creation_wizard_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creation_wizard_session_deleted_at" ON "creation_wizard_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "draft_dependency_node" ("id" text not null, "wizard_session_id" text not null, "node_type" text not null, "requested_identity_json" jsonb not null, "parent_node_id" text null, "resolution_status" text check ("resolution_status" in ('unresolved', 'resolved', 'blocked', 'failed')) not null default 'unresolved', "resolved_entity_id" text null, "error_json" jsonb null, "provenance_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "draft_dependency_node_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_draft_dependency_node_deleted_at" ON "draft_dependency_node" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pack_assignment" ("id" text not null, "scope_type" text check ("scope_type" in ('technology_platform', 'vendor_generation', 'server_family', 'server_model', 'chassis_variant', 'storage_option')) not null, "scope_id" text not null, "component_pack_id" text not null, "enabled" boolean not null default true, "priority" integer not null default 100, "inheritance_behavior" text check ("inheritance_behavior" in ('inherit', 'override', 'exclude')) not null default 'inherit', "exclusions_json" jsonb null, "overrides_json" jsonb null, "assignment_source" text not null, "source_reference" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pack_assignment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pack_assignment_deleted_at" ON "pack_assignment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "property_assignment" ("id" text not null, "owner_type" text not null, "owner_id" text not null, "property_definition_id" text not null, "assignment_mode" text check ("assignment_mode" in ('direct', 'inherited', 'override', 'disable', 'unresolved_draft')) not null, "value_json" jsonb null, "inherited_from_type" text null, "inherited_from_id" text null, "provenance_json" jsonb null, "confidence" real null, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "property_assignment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_assignment_deleted_at" ON "property_assignment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "property_definition" ("id" text not null, "key" text not null, "label" text not null, "description" text null, "value_type" text check ("value_type" in ('text', 'number', 'boolean', 'enum', 'reference', 'list', 'object')) not null, "unit" text null, "normalization_rule_json" jsonb null, "allowed_values_json" jsonb null, "reference_concept_type" text null, "entity_scopes" text[] not null, "required" boolean not null default false, "default_value_json" jsonb null, "displayable" boolean not null default true, "filterable" boolean not null default false, "comparable" boolean not null default false, "searchable" boolean not null default false, "inheritable" boolean not null default false, "affects_compatibility" boolean not null default false, "fact_path" text null, "validator_key" text null, "schema_version" integer not null default 1, "usage_status" text check ("usage_status" in ('informational', 'filterable', 'comparable', 'engine_mapped', 'unmapped', 'deprecated', 'unmapped_compatibility_property')) not null default 'informational', "lifecycle_status" text check ("lifecycle_status" in ('draft', 'active', 'deprecated')) not null default 'draft', "source_policy_json" jsonb null, "review_policy_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "property_definition_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_property_definition_key_unique" ON "property_definition" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_definition_deleted_at" ON "property_definition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "property_link_requirement" ("id" text not null, "owner_type" text not null, "owner_id" text not null, "requirement_type" text check ("requirement_type" in ('property', 'concept', 'relation', 'validator_mapping')) not null, "stable_key" text not null, "reason" text not null, "blocking" boolean not null default true, "resolution_status" text check ("resolution_status" in ('unresolved', 'resolved', 'waived')) not null default 'unresolved', "resolved_entity_id" text null, "provenance_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "property_link_requirement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_link_requirement_deleted_at" ON "property_link_requirement" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "property_value" ("id" text not null, "owner_entity_type" text not null, "owner_entity_id" text not null, "property_definition_id" text not null, "normalized_value_json" jsonb null, "raw_value_json" jsonb null, "unit" text null, "source_json" jsonb null, "confidence" real null, "review_status" text check ("review_status" in ('unreviewed', 'verified', 'rejected')) not null default 'unreviewed', "inherited_from_type" text null, "inherited_from_id" text null, "overridden" boolean not null default false, "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "property_value_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_value_deleted_at" ON "property_value" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "relation_type_definition" ("id" text not null, "key" text not null, "name" text not null, "allowed_source_types_json" jsonb not null, "allowed_target_types_json" jsonb not null, "inverse_relation_key" text null, "supports_quantity" boolean not null default false, "supports_conditions" boolean not null default false, "engine_mapping" text null, "validator_key" text null, "status" text check ("status" in ('informational', 'engine_mapped', 'unmapped', 'deprecated')) not null default 'unmapped', "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "relation_type_definition_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_relation_type_definition_key_unique" ON "relation_type_definition" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_relation_type_definition_deleted_at" ON "relation_type_definition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_family" ("id" text not null, "key" text not null, "name" text not null, "vendor_generation_template_id" text not null, "properties_json" jsonb null, "source_json" jsonb null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_family_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_server_family_key_unique" ON "server_family" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_family_deleted_at" ON "server_family" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_model_component_assignment" ("id" text not null, "server_model_id" text not null, "component_id" text not null, "assignment_role" text check ("assignment_role" in ('optional_choice', 'required_component', 'default_component', 'auto_added_technical', 'enablement_kit', 'replacement_option')) not null, "selection_mode" text check ("selection_mode" in ('visible', 'advanced_only', 'hidden_technical', 'informational')) not null, "default_quantity" integer not null default 0, "min_quantity" integer not null default 0, "max_quantity" integer not null default 1, "enabled" boolean not null default true, "sort_order" integer not null default 100, "requirements_override_json" jsonb null, "provides_override_json" jsonb null, "consumes_override_json" jsonb null, "conflicts_override_json" jsonb null, "source_doc_reference" text null, "assignment_source" text not null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_model_component_assignment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_component_assignment_deleted_at" ON "server_model_component_assignment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "server_storage_option" ("id" text not null, "server_model_id" text not null, "key" text not null, "public_name" text not null, "storage_cages_json" jsonb not null, "backplane_variants_json" jsonb not null, "optional_components_json" jsonb null, "drive_limits_json" jsonb not null, "suggested_drive_packs_json" jsonb null, "required_bundles_json" jsonb null, "conflicts_json" jsonb null, "is_base" boolean not null default false, "is_default" boolean not null default false, "source_doc_reference" text null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "server_storage_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_storage_option_deleted_at" ON "server_storage_option" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "storage_cage_definition" ("id" text not null, "name" text not null, "location" text check ("location" in ('front', 'rear', 'internal', 'mid')) not null, "bay_groups_json" jsonb not null, "hot_swap" boolean not null default false, "max_total_drives" integer not null, "source_doc_reference" text null, "enabled" boolean not null default true, "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storage_cage_definition_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storage_cage_definition_deleted_at" ON "storage_cage_definition" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "storage_topology" ("id" text not null, "owner_type" text not null, "owner_id" text not null, "zones_json" jsonb not null, "requirements_json" jsonb null, "provides_json" jsonb null, "consumes_json" jsonb null, "conflicts_json" jsonb null, "source_doc_reference" text null, "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storage_topology_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storage_topology_deleted_at" ON "storage_topology" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "technology_concept" ("id" text not null, "concept_type_id" text not null, "stable_key" text not null, "display_name" text not null, "vendor_scope" text null, "normalized_attributes_json" jsonb null, "source_json" jsonb null, "lifecycle_status" text check ("lifecycle_status" in ('draft', 'active', 'deprecated')) not null default 'active', "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "technology_concept_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_technology_concept_stable_key_unique" ON "technology_concept" ("stable_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_concept_deleted_at" ON "technology_concept" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "technology_concept_type" ("id" text not null, "key" text not null, "name" text not null, "schema_json" jsonb null, "allowed_relation_types_json" jsonb null, "validator_key" text null, "fact_mapping_json" jsonb null, "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "technology_concept_type_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_technology_concept_type_key_unique" ON "technology_concept_type" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_concept_type_deleted_at" ON "technology_concept_type" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "technology_platform" ("id" text not null, "key" text not null, "name" text not null, "supported_concepts_json" jsonb not null, "properties_json" jsonb null, "source_json" jsonb null, "review_status" text check ("review_status" in ('draft', 'verified', 'deprecated')) not null default 'draft', "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "technology_platform_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_technology_platform_key_unique" ON "technology_platform" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_platform_deleted_at" ON "technology_platform" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "technology_relation" ("id" text not null, "source_type" text not null, "source_id" text not null, "relation_type_id" text not null, "target_type" text not null, "target_id" text not null, "quantity" real null, "unit" text null, "conditions_json" jsonb null, "source_reference" text null, "confidence" real null, "review_status" text check ("review_status" in ('unreviewed', 'verified', 'rejected')) not null default 'unreviewed', "inherited_from_type" text null, "inherited_from_id" text null, "enabled" boolean not null default true, "schema_version" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "technology_relation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_relation_deleted_at" ON "technology_relation" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vendor_generation_template" ("id" text not null, "key" text not null, "vendor" text not null, "generation_label" text not null, "architecture_variant" text null, "technology_platform_id" text not null, "inherited_properties_json" jsonb null, "default_option_groups_json" jsonb null, "source_json" jsonb null, "review_status" text check ("review_status" in ('draft', 'verified', 'deprecated')) not null default 'draft', "schema_version" integer not null default 1, "enabled" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vendor_generation_template_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vendor_generation_template_key_unique" ON "vendor_generation_template" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_generation_template_deleted_at" ON "vendor_generation_template" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "component" drop constraint if exists "component_type_check";`);

    this.addSql(`alter table if exists "component" add column if not exists "normalized_specs_json" jsonb null, add column if not exists "raw_specs_json" jsonb null, add column if not exists "requirements_json" jsonb null, add column if not exists "provides_json" jsonb null, add column if not exists "consumes_json" jsonb null, add column if not exists "applicability_json" jsonb null, add column if not exists "source_json" jsonb null, add column if not exists "schema_version" integer not null default 1, add column if not exists "normalization_status" text check ("normalization_status" in ('normalized', 'partially_normalized', 'unmapped', 'informational')) not null default 'unmapped';`);
    this.addSql(`alter table if exists "component" add constraint "component_type_check" check("type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'drive_cage', 'boot_storage', 'accelerator', 'rails', 'cable', 'cooling', 'license', 'service'));`);
    this.addSql(`update "component" set "normalized_specs_json" = coalesce("normalized_specs_json", "specs_json", '{}'::jsonb), "raw_specs_json" = coalesce("raw_specs_json", "specs_json", '{}'::jsonb), "source_json" = coalesce("source_json", jsonb_build_object('adapter', 'legacy_specs_json_v1', 'source_doc_reference', "specs_json"->>'source_doc_reference')), "normalization_status" = case when "normalization_status" = 'unmapped' and "specs_json" is not null then 'partially_normalized' else "normalization_status" end where "normalized_specs_json" is null or "raw_specs_json" is null or "source_json" is null;`);

    this.addSql(`alter table if exists "server_model" add column if not exists "technology_platform_id" text null, add column if not exists "vendor_generation_template_id" text null, add column if not exists "server_family_id" text null, add column if not exists "capability_profile_id" text null, add column if not exists "schema_version" integer not null default 1;`);

    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_concept_alias_concept" ON "concept_alias" ("technology_concept_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_value_definition" ON "property_value" ("property_definition_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_value_owner" ON "property_value" ("owner_entity_type", "owner_entity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_concept_type" ON "technology_concept" ("concept_type_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_relation_type" ON "technology_relation" ("relation_type_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_relation_source" ON "technology_relation" ("source_type", "source_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_technology_relation_target" ON "technology_relation" ("target_type", "target_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vendor_generation_platform" ON "vendor_generation_template" ("technology_platform_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_family_generation" ON "server_family" ("vendor_generation_template_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chassis_variant_server" ON "chassis_variant" ("server_model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pack_assignment_scope" ON "pack_assignment" ("scope_type", "scope_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pack_assignment_pack" ON "pack_assignment" ("component_pack_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pack_assignment_unique" ON "pack_assignment" ("scope_type", "scope_id", "component_pack_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_component_assignment_server" ON "server_model_component_assignment" ("server_model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_component_assignment_component" ON "server_model_component_assignment" ("component_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_storage_option_server" ON "server_storage_option" ("server_model_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_server_storage_option_key" ON "server_storage_option" ("server_model_id", "key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_option_group_scope" ON "configurator_option_group" ("scope_type", "scope_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_option_group_key" ON "configurator_option_group" ("scope_type", "scope_id", "key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_draft_node_session" ON "draft_dependency_node" ("wizard_session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_creation_manifest_session" ON "creation_manifest" ("wizard_session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_assignment_definition" ON "property_assignment" ("property_definition_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_assignment_owner" ON "property_assignment" ("owner_type", "owner_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_property_link_requirement_owner" ON "property_link_requirement" ("owner_type", "owner_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_item_pack" ON "component_pack_item" ("component_pack_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_pack_item_component" ON "component_pack_item" ("component_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_platform" ON "server_model" ("technology_platform_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_generation_template" ON "server_model" ("vendor_generation_template_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_family" ON "server_model" ("server_family_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_server_model_capability" ON "server_model" ("capability_profile_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table "concept_alias" add constraint "concept_alias_concept_fk" foreign key ("technology_concept_id") references "technology_concept" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "property_value" add constraint "property_value_definition_fk" foreign key ("property_definition_id") references "property_definition" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "technology_concept" add constraint "technology_concept_type_fk" foreign key ("concept_type_id") references "technology_concept_type" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "technology_relation" add constraint "technology_relation_type_fk" foreign key ("relation_type_id") references "relation_type_definition" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "vendor_generation_template" add constraint "vendor_generation_platform_fk" foreign key ("technology_platform_id") references "technology_platform" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_family" add constraint "server_family_generation_fk" foreign key ("vendor_generation_template_id") references "vendor_generation_template" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "chassis_variant" add constraint "chassis_variant_server_fk" foreign key ("server_model_id") references "server_model" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "pack_assignment" add constraint "pack_assignment_pack_fk" foreign key ("component_pack_id") references "component_pack" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "server_model_component_assignment" add constraint "server_component_assignment_server_fk" foreign key ("server_model_id") references "server_model" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "server_model_component_assignment" add constraint "server_component_assignment_component_fk" foreign key ("component_id") references "component" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_storage_option" add constraint "server_storage_option_server_fk" foreign key ("server_model_id") references "server_model" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "draft_dependency_node" add constraint "draft_node_session_fk" foreign key ("wizard_session_id") references "creation_wizard_session" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "creation_manifest" add constraint "creation_manifest_session_fk" foreign key ("wizard_session_id") references "creation_wizard_session" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "property_assignment" add constraint "property_assignment_definition_fk" foreign key ("property_definition_id") references "property_definition" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "component_pack_item" add constraint "component_pack_item_pack_fk" foreign key ("component_pack_id") references "component_pack" ("id") on delete cascade not valid;`);
    this.addSql(`alter table "component_pack_item" add constraint "component_pack_item_component_fk" foreign key ("component_id") references "component" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_model" add constraint "server_model_platform_fk" foreign key ("technology_platform_id") references "technology_platform" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_model" add constraint "server_model_generation_template_fk" foreign key ("vendor_generation_template_id") references "vendor_generation_template" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_model" add constraint "server_model_family_fk" foreign key ("server_family_id") references "server_family" ("id") on delete restrict not valid;`);
    this.addSql(`alter table "server_model" add constraint "server_model_capability_fk" foreign key ("capability_profile_id") references "capability_profile" ("id") on delete set null not valid;`);

    const componentTypes = [
      ['cpu', 'CPU'], ['ram', 'RAM'], ['drive', 'Drive'], ['raid', 'RAID controller'],
      ['nic', 'Network adapter'], ['psu', 'Power supply'], ['riser', 'Riser'],
      ['backplane', 'Backplane'], ['drive_cage', 'Drive cage'], ['boot_storage', 'Boot storage'],
      ['accelerator', 'Accelerator'], ['cooling', 'Cooling'], ['cable', 'Cable'],
      ['rails', 'Rails'], ['license', 'License'], ['service', 'Service'],
    ];
    for (const [key, name] of componentTypes) {
      const fields = key === 'accelerator'
        ? { type: 'object', properties: { subtype: { enum: ['gpu', 'fpga', 'dpu', 'ai_accelerator'] } }, required: ['subtype'] }
        : { type: 'object', additionalProperties: true };
      const validator = ['license', 'service'].includes(key) ? null : `component.${key}.v1`;
      this.addSql(`insert into "component_type_definition" ("id", "key", "name", "fields_schema_json", "facts_mapping_json", "validator_key", "schema_version", "enabled") values ('ctd_${key}', '${key}', '${name}', '${JSON.stringify(fields)}'::jsonb, '{}'::jsonb, ${validator ? `'${validator}'` : 'null'}, 1, true) on conflict ("id") do update set "name" = excluded."name", "fields_schema_json" = excluded."fields_schema_json", "validator_key" = excluded."validator_key", "updated_at" = now();`);
    }

    const conceptTypes = [
      'cpu_socket', 'processor_platform', 'memory_technology', 'memory_module_type',
      'drive_form_factor', 'storage_protocol', 'connector_type', 'pcie_generation',
      'slot_class', 'network_mezzanine_type', 'cooling_method', 'rail_type',
      'management_generation', 'interconnect_capability',
    ];
    for (const key of conceptTypes) {
      this.addSql(`insert into "technology_concept_type" ("id", "key", "name", "schema_json", "allowed_relation_types_json", "schema_version", "enabled") values ('tct_${key}', '${key}', '${key.replaceAll('_', ' ')}', '{}'::jsonb, '[]'::jsonb, 1, true) on conflict ("id") do nothing;`);
    }

    const relationTypes = [
      ['requires', true, true], ['provides', true, true], ['consumes', true, true],
      ['accepts', true, true], ['supports', false, true], ['converts_to', true, true],
      ['conflicts_with', false, true], ['qualified_for', false, true],
      ['enables', false, true], ['replaces', false, true], ['member_of', false, false],
    ];
    for (const [key, quantity, conditional] of relationTypes) {
      this.addSql(`insert into "relation_type_definition" ("id", "key", "name", "allowed_source_types_json", "allowed_target_types_json", "supports_quantity", "supports_conditions", "engine_mapping", "validator_key", "status", "schema_version") values ('rtd_${key}', '${key}', '${String(key).replaceAll('_', ' ')}', '[]'::jsonb, '[]'::jsonb, ${quantity}, ${conditional}, 'facts.relations.${key}', 'relation.${key}.v1', 'engine_mapped', 1) on conflict ("id") do nothing;`);
    }

    const concepts = [
      ['fclga3647', 'cpu_socket', 'FCLGA3647'], ['lga4677', 'cpu_socket', 'LGA4677'],
      ['ddr5', 'memory_technology', 'DDR5'], ['rdimm', 'memory_module_type', 'RDIMM'],
      ['sas', 'storage_protocol', 'SAS'], ['sata', 'storage_protocol', 'SATA'],
      ['nvme', 'storage_protocol', 'NVMe'], ['lff', 'drive_form_factor', 'LFF'],
      ['sff', 'drive_form_factor', 'SFF'], ['e3s', 'drive_form_factor', 'E3.S'],
      ['ocp3', 'network_mezzanine_type', 'OCP 3.0'],
    ];
    for (const [key, type, name] of concepts) {
      this.addSql(`insert into "technology_concept" ("id", "concept_type_id", "stable_key", "display_name", "normalized_attributes_json", "source_json", "lifecycle_status", "schema_version") values ('tc_${key}', 'tct_${type}', '${key}', '${name}', '{}'::jsonb, '{"source":"stage-03-canonical-bootstrap"}'::jsonb, 'active', 1) on conflict ("id") do nothing;`);
    }
    for (const [id, alias] of [['fclga3647', 'FCLGA3647'], ['lga3647', 'LGA3647'], ['socket_p', 'Socket P']]) {
      this.addSql(`insert into "concept_alias" ("id", "technology_concept_id", "alias", "normalized_alias", "source_json", "enabled") values ('ca_${id}', 'tc_fclga3647', '${alias}', '${alias.toLowerCase().replaceAll(' ', '_')}', '{"source":"stage-03-canonical-bootstrap"}'::jsonb, true) on conflict ("id") do nothing;`);
    }

    const properties = [
      ['cpu.socket', 'CPU socket', 'reference', null, true, 'cpu.socket', 'property.cpu_socket.v1'],
      ['cpu.cores', 'CPU cores', 'number', 'core', false, null, null],
      ['cpu.threads', 'CPU threads', 'number', 'thread', false, null, null],
      ['cpu.base_frequency', 'Base frequency', 'number', 'GHz', false, null, null],
      ['cpu.turbo_frequency', 'Turbo frequency', 'number', 'GHz', false, null, null],
      ['cpu.cache', 'Cache', 'number', 'MB', false, null, null],
      ['cpu.tdp', 'Thermal design power', 'number', 'W', true, 'cpu.tdp', 'property.cpu_tdp.v1'],
      ['cpu.max_memory_speed', 'Maximum memory speed', 'number', 'MT/s', true, 'cpu.max_memory_speed', 'property.cpu_memory_speed.v1'],
      ['cpu.memory_channels', 'Memory channels', 'number', 'channel', true, 'cpu.memory_channels', 'property.cpu_memory_channels.v1'],
      ['cpu.upi_links', 'UPI links', 'number', 'link', true, 'cpu.upi_links', 'property.cpu_upi.v1'],
      ['cpu.pcie_generation', 'PCIe generation', 'reference', null, true, 'cpu.pcie_generation', 'property.cpu_pcie.v1'],
      ['cpu.max_socket_count', 'Maximum socket count', 'number', 'socket', true, 'cpu.max_socket_count', 'property.cpu_socket_count.v1'],
      ['accelerator.subtype', 'Accelerator subtype', 'enum', null, true, 'accelerator.subtype', 'property.accelerator_subtype.v1'],
      ['storage.form_factor', 'Drive form factor', 'reference', null, true, 'storage.form_factor', 'property.drive_form_factor.v1'],
      ['storage.protocol', 'Storage protocol', 'reference', null, true, 'storage.protocol', 'property.storage_protocol.v1'],
    ];
    for (const [key, label, valueType, unit, affects, factPath, validator] of properties) {
      this.addSql(`insert into "property_definition" ("id", "key", "label", "value_type", "unit", "entity_scopes", "displayable", "filterable", "comparable", "searchable", "inheritable", "affects_compatibility", "fact_path", "validator_key", "schema_version", "usage_status", "lifecycle_status") values ('pd_${String(key).replaceAll('.', '_')}', '${key}', '${label}', '${valueType}', ${unit ? `'${unit}'` : 'null'}, array['component','component_pack','technology_platform','vendor_generation','server_family','server_model','chassis_variant','storage_option'], true, true, true, false, true, ${affects}, ${factPath ? `'${factPath}'` : 'null'}, ${validator ? `'${validator}'` : 'null'}, 1, ${affects ? `'engine_mapped'` : `'comparable'`}, 'active') on conflict ("id") do nothing;`);
    }
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "component_pack_item" drop constraint if exists "component_pack_item_pack_fk", drop constraint if exists "component_pack_item_component_fk";`);

    this.addSql(`drop table if exists "backplane_variant" cascade;`);

    this.addSql(`drop table if exists "capability_profile" cascade;`);

    this.addSql(`drop table if exists "chassis_variant" cascade;`);

    this.addSql(`drop table if exists "component_type_definition" cascade;`);

    this.addSql(`drop table if exists "concept_alias" cascade;`);

    this.addSql(`drop table if exists "configurator_option_group" cascade;`);

    this.addSql(`drop table if exists "creation_manifest" cascade;`);

    this.addSql(`drop table if exists "creation_wizard_session" cascade;`);

    this.addSql(`drop table if exists "draft_dependency_node" cascade;`);

    this.addSql(`drop table if exists "pack_assignment" cascade;`);

    this.addSql(`drop table if exists "property_assignment" cascade;`);

    this.addSql(`drop table if exists "property_definition" cascade;`);

    this.addSql(`drop table if exists "property_link_requirement" cascade;`);

    this.addSql(`drop table if exists "property_value" cascade;`);

    this.addSql(`drop table if exists "relation_type_definition" cascade;`);

    this.addSql(`drop table if exists "server_family" cascade;`);

    this.addSql(`drop table if exists "server_model_component_assignment" cascade;`);

    this.addSql(`drop table if exists "server_storage_option" cascade;`);

    this.addSql(`drop table if exists "storage_cage_definition" cascade;`);

    this.addSql(`drop table if exists "storage_topology" cascade;`);

    this.addSql(`drop table if exists "technology_concept" cascade;`);

    this.addSql(`drop table if exists "technology_concept_type" cascade;`);

    this.addSql(`drop table if exists "technology_platform" cascade;`);

    this.addSql(`drop table if exists "technology_relation" cascade;`);

    this.addSql(`drop table if exists "vendor_generation_template" cascade;`);

    this.addSql(`alter table if exists "component" drop constraint if exists "component_type_check";`);

    this.addSql(`alter table if exists "component" drop column if exists "normalized_specs_json", drop column if exists "raw_specs_json", drop column if exists "requirements_json", drop column if exists "provides_json", drop column if exists "consumes_json", drop column if exists "applicability_json", drop column if exists "source_json", drop column if exists "schema_version", drop column if exists "normalization_status";`);

    this.addSql(`alter table if exists "component" add constraint "component_type_check" check("type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'rails', 'cable', 'cooling', 'license', 'service'));`);

    this.addSql(`alter table if exists "component_pack" drop constraint if exists "component_pack_component_type_check";`);
    this.addSql(`alter table if exists "component_pack" drop constraint if exists "component_pack_pack_kind_check";`);
    this.addSql(`alter table if exists "component_pack" drop column if exists "pack_kind", drop column if exists "defaults_json", drop column if exists "schema_version";`);
    this.addSql(`alter table if exists "component_pack" add constraint "component_pack_component_type_check" check("component_type" in ('cpu', 'ram', 'drive', 'raid', 'nic', 'psu', 'riser', 'backplane', 'rails', 'cable', 'cooling', 'license', 'service'));`);

    this.addSql(`alter table if exists "server_model" drop column if exists "technology_platform_id", drop column if exists "vendor_generation_template_id", drop column if exists "server_family_id", drop column if exists "capability_profile_id", drop column if exists "schema_version";`);
  }

}
