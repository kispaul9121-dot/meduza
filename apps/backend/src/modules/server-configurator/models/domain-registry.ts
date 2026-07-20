import { model } from "@medusajs/framework/utils"

export const ComponentTypeDefinition = model.define("component_type_definition", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  description: model.text().nullable(),
  fields_schema_json: model.json(),
  ui_schema_json: model.json().nullable(),
  facts_mapping_json: model.json().nullable(),
  validator_key: model.text().nullable(),
  compatibility_mode: model.enum(["validated", "informational"]).default("validated"),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

// PropertyDefinition is the only canonical property/attribute registry.
export const PropertyDefinition = model.define("property_definition", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  label: model.text(),
  description: model.text().nullable(),
  value_type: model.enum(["text", "number", "boolean", "enum", "reference", "list", "object"]),
  unit: model.text().nullable(),
  normalization_rule_json: model.json().nullable(),
  allowed_values_json: model.json().nullable(),
  reference_concept_type: model.text().nullable(),
  entity_scopes: model.array(),
  required: model.boolean().default(false),
  default_value_json: model.json().nullable(),
  displayable: model.boolean().default(true),
  filterable: model.boolean().default(false),
  comparable: model.boolean().default(false),
  searchable: model.boolean().default(false),
  inheritable: model.boolean().default(false),
  affects_compatibility: model.boolean().default(false),
  fact_path: model.text().nullable(),
  validator_key: model.text().nullable(),
  schema_version: model.number().default(1),
  usage_status: model.enum([
    "informational",
    "filterable",
    "comparable",
    "engine_mapped",
    "unmapped",
    "deprecated",
    "unmapped_compatibility_property",
  ]).default("informational"),
  lifecycle_status: model.enum(["draft", "active", "deprecated"]).default("draft"),
  source_policy_json: model.json().nullable(),
  review_policy_json: model.json().nullable(),
})

export const PropertyValue = model.define("property_value", {
  id: model.id().primaryKey(),
  owner_entity_type: model.text(),
  owner_entity_id: model.text(),
  property_definition_id: model.text(),
  normalized_value_json: model.json().nullable(),
  raw_value_json: model.json().nullable(),
  unit: model.text().nullable(),
  source_json: model.json().nullable(),
  confidence: model.float().nullable(),
  review_status: model.enum(["unreviewed", "verified", "rejected"]).default("unreviewed"),
  inherited_from_type: model.text().nullable(),
  inherited_from_id: model.text().nullable(),
  overridden: model.boolean().default(false),
  schema_version: model.number().default(1),
})

export const TechnologyConceptType = model.define("technology_concept_type", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  schema_json: model.json().nullable(),
  allowed_relation_types_json: model.json().nullable(),
  validator_key: model.text().nullable(),
  fact_mapping_json: model.json().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const TechnologyConcept = model.define("technology_concept", {
  id: model.id().primaryKey(),
  concept_type_id: model.text(),
  stable_key: model.text().unique(),
  display_name: model.text(),
  vendor_scope: model.text().nullable(),
  normalized_attributes_json: model.json().nullable(),
  source_json: model.json().nullable(),
  lifecycle_status: model.enum(["draft", "active", "deprecated"]).default("active"),
  schema_version: model.number().default(1),
})

export const ConceptAlias = model.define("concept_alias", {
  id: model.id().primaryKey(),
  technology_concept_id: model.text(),
  alias: model.text(),
  normalized_alias: model.text(),
  source_json: model.json().nullable(),
  enabled: model.boolean().default(true),
})

export const RelationTypeDefinition = model.define("relation_type_definition", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  allowed_source_types_json: model.json(),
  allowed_target_types_json: model.json(),
  inverse_relation_key: model.text().nullable(),
  supports_quantity: model.boolean().default(false),
  supports_conditions: model.boolean().default(false),
  engine_mapping: model.text().nullable(),
  validator_key: model.text().nullable(),
  status: model.enum(["informational", "engine_mapped", "unmapped", "deprecated"]).default("unmapped"),
  schema_version: model.number().default(1),
})

export const TechnologyRelation = model.define("technology_relation", {
  id: model.id().primaryKey(),
  source_type: model.text(),
  source_id: model.text(),
  relation_type_id: model.text(),
  target_type: model.text(),
  target_id: model.text(),
  quantity: model.float().nullable(),
  unit: model.text().nullable(),
  conditions_json: model.json().nullable(),
  source_reference: model.text().nullable(),
  confidence: model.float().nullable(),
  review_status: model.enum(["unreviewed", "verified", "rejected"]).default("unreviewed"),
  inherited_from_type: model.text().nullable(),
  inherited_from_id: model.text().nullable(),
  enabled: model.boolean().default(true),
  schema_version: model.number().default(1),
})

export const TechnologyPlatform = model.define("technology_platform", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  supported_concepts_json: model.json(),
  properties_json: model.json().nullable(),
  source_json: model.json().nullable(),
  review_status: model.enum(["draft", "verified", "deprecated"]).default("draft"),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const VendorGenerationTemplate = model.define("vendor_generation_template", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  vendor: model.text(),
  generation_label: model.text(),
  architecture_variant: model.text().nullable(),
  technology_platform_id: model.text(),
  inherited_properties_json: model.json().nullable(),
  default_option_groups_json: model.json().nullable(),
  source_json: model.json().nullable(),
  review_status: model.enum(["draft", "verified", "deprecated"]).default("draft"),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const ServerFamily = model.define("server_family", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  vendor_generation_template_id: model.text(),
  properties_json: model.json().nullable(),
  source_json: model.json().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const ChassisVariant = model.define("chassis_variant", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  server_model_id: model.text(),
  name: model.text(),
  properties_json: model.json().nullable(),
  source_json: model.json().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const PackAssignment = model.define("pack_assignment", {
  id: model.id().primaryKey(),
  scope_type: model.enum([
    "technology_platform",
    "vendor_generation",
    "server_family",
    "server_model",
    "chassis_variant",
    "storage_option",
  ]),
  scope_id: model.text(),
  component_pack_id: model.text(),
  enabled: model.boolean().default(true),
  priority: model.number().default(100),
  inheritance_behavior: model.enum(["inherit", "override", "exclude"]).default("inherit"),
  exclusions_json: model.json().nullable(),
  overrides_json: model.json().nullable(),
  assignment_source: model.text(),
  source_reference: model.text().nullable(),
})

export const ServerModelComponentAssignment = model.define("server_model_component_assignment", {
  id: model.id().primaryKey(),
  server_model_id: model.text(),
  component_id: model.text(),
  assignment_role: model.enum([
    "optional_choice",
    "required_component",
    "default_component",
    "auto_added_technical",
    "enablement_kit",
    "replacement_option",
  ]),
  selection_mode: model.enum(["visible", "advanced_only", "hidden_technical", "informational"]),
  default_quantity: model.number().default(0),
  min_quantity: model.number().default(0),
  max_quantity: model.number().default(1),
  enabled: model.boolean().default(true),
  sort_order: model.number().default(100),
  requirements_override_json: model.json().nullable(),
  provides_override_json: model.json().nullable(),
  consumes_override_json: model.json().nullable(),
  conflicts_override_json: model.json().nullable(),
  source_doc_reference: model.text().nullable(),
  assignment_source: model.text(),
  notes: model.text().nullable(),
})

export const CapabilityProfile = model.define("capability_profile", {
  id: model.id().primaryKey(),
  owner_type: model.text(),
  owner_id: model.text(),
  platform_json: model.json(),
  cpu_json: model.json(),
  memory_json: model.json(),
  storage_json: model.json(),
  expansion_json: model.json(),
  network_json: model.json(),
  accelerator_json: model.json(),
  boot_storage_json: model.json(),
  power_json: model.json(),
  cooling_json: model.json(),
  management_json: model.json(),
  source_json: model.json().nullable(),
  schema_version: model.number().default(1),
  review_status: model.enum(["draft", "verified", "deprecated"]).default("draft"),
})

export const StorageTopology = model.define("storage_topology", {
  id: model.id().primaryKey(),
  owner_type: model.text(),
  owner_id: model.text(),
  zones_json: model.json(),
  requirements_json: model.json().nullable(),
  provides_json: model.json().nullable(),
  consumes_json: model.json().nullable(),
  conflicts_json: model.json().nullable(),
  source_doc_reference: model.text().nullable(),
  schema_version: model.number().default(1),
})

export const StorageCageDefinition = model.define("storage_cage_definition", {
  id: model.id().primaryKey(),
  name: model.text(),
  location: model.enum(["front", "rear", "internal", "mid"]),
  bay_groups_json: model.json(),
  hot_swap: model.boolean().default(false),
  max_total_drives: model.number(),
  source_doc_reference: model.text().nullable(),
  enabled: model.boolean().default(true),
  schema_version: model.number().default(1),
})

export const BackplaneVariant = model.define("backplane_variant", {
  id: model.id().primaryKey(),
  name: model.text(),
  supported_protocols: model.array(),
  connector_types: model.array(),
  connection_mode: model.enum(["direct_attach", "expander", "hybrid"]),
  max_protocol_bays_json: model.json().nullable(),
  lane_requirements_json: model.json().nullable(),
  required_controller_capabilities_json: model.json().nullable(),
  required_cables_json: model.json().nullable(),
  provides_json: model.json().nullable(),
  consumes_json: model.json().nullable(),
  conflicts_json: model.json().nullable(),
  source_doc_reference: model.text().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const ServerStorageOption = model.define("server_storage_option", {
  id: model.id().primaryKey(),
  server_model_id: model.text(),
  key: model.text(),
  public_name: model.text(),
  storage_cages_json: model.json(),
  backplane_variants_json: model.json(),
  optional_components_json: model.json().nullable(),
  drive_limits_json: model.json(),
  suggested_drive_packs_json: model.json().nullable(),
  required_bundles_json: model.json().nullable(),
  conflicts_json: model.json().nullable(),
  is_base: model.boolean().default(false),
  is_default: model.boolean().default(false),
  source_doc_reference: model.text().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const ConfiguratorOptionGroup = model.define("configurator_option_group", {
  id: model.id().primaryKey(),
  key: model.text(),
  title: model.text(),
  scope_type: model.enum(["server_model", "technology_platform", "vendor_generation", "server_family"]),
  scope_id: model.text(),
  component_type: model.text(),
  source_types_json: model.json(),
  selection_cardinality: model.enum(["zero_or_one", "exactly_one", "zero_or_many", "one_or_many"]),
  allow_none: model.boolean().default(false),
  none_label: model.text().nullable(),
  none_selected_by_default: model.boolean().default(false),
  min_quantity: model.number().default(0),
  max_quantity: model.number().default(1),
  sort_order: model.number().default(100),
  advanced: model.boolean().default(false),
  help_text: model.text().nullable(),
  visibility_rules_json: model.json().nullable(),
  schema_version: model.number().default(1),
  enabled: model.boolean().default(true),
})

export const CreationWizardSession = model.define("creation_wizard_session", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  current_step: model.text(),
  draft_payload_json: model.json(),
  mode_hint: model.text().nullable(),
  status: model.enum(["draft", "ready", "applying", "completed", "failed", "abandoned"]).default("draft"),
  schema_version: model.number().default(1),
})

export const DraftDependencyNode = model.define("draft_dependency_node", {
  id: model.id().primaryKey(),
  wizard_session_id: model.text(),
  node_type: model.text(),
  requested_identity_json: model.json(),
  parent_node_id: model.text().nullable(),
  resolution_status: model.enum(["unresolved", "resolved", "blocked", "failed"]).default("unresolved"),
  resolved_entity_id: model.text().nullable(),
  error_json: model.json().nullable(),
  provenance_json: model.json().nullable(),
})

export const CreationManifest = model.define("creation_manifest", {
  id: model.id().primaryKey(),
  wizard_session_id: model.text(),
  planned_creates_json: model.json(),
  planned_updates_json: model.json(),
  planned_links_json: model.json(),
  planned_assignments_json: model.json(),
  warnings_json: model.json(),
  blockers_json: model.json(),
  publication_actions_json: model.json(),
  manifest_version: model.number().default(1),
  status: model.enum(["preview", "confirmed", "applied", "superseded"]).default("preview"),
})

export const PropertyAssignment = model.define("property_assignment", {
  id: model.id().primaryKey(),
  owner_type: model.text(),
  owner_id: model.text(),
  property_definition_id: model.text(),
  assignment_mode: model.enum(["direct", "inherited", "override", "disable", "unresolved_draft"]),
  value_json: model.json().nullable(),
  inherited_from_type: model.text().nullable(),
  inherited_from_id: model.text().nullable(),
  provenance_json: model.json().nullable(),
  confidence: model.float().nullable(),
  enabled: model.boolean().default(true),
})

export const PropertyLinkRequirement = model.define("property_link_requirement", {
  id: model.id().primaryKey(),
  owner_type: model.text(),
  owner_id: model.text(),
  requirement_type: model.enum(["property", "concept", "relation", "validator_mapping"]),
  stable_key: model.text(),
  reason: model.text(),
  blocking: model.boolean().default(true),
  resolution_status: model.enum(["unresolved", "resolved", "waived"]).default("unresolved"),
  resolved_entity_id: model.text().nullable(),
  provenance_json: model.json().nullable(),
})
