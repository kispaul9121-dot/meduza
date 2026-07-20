import { z } from "@medusajs/framework/zod";

const jsonObject = z.record(z.string(), z.unknown());
const optionalText = z.string().nullable().optional();
const textArray = z.array(z.string()).optional().nullable();

const componentTypes = [
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
] as const;
const scopeTypes = [
  "global",
  "brand",
  "generation",
  "family",
  "server_model",
  "chassis_variant",
  "component",
] as const;
const packTargetScopes = [
  "global",
  "brand",
  "generation",
  "family",
  "server_model",
  "chassis_type",
] as const;
const ruleCategories = [
  "cpu",
  "ram",
  "storage",
  "raid",
  "nic",
  "psu",
  "riser",
  "cooling",
  "backplane",
] as const;
const ruleTypes = [
  "allow",
  "block",
  "require",
  "limit",
  "warning",
  "downgrade",
  "auto_add",
  "price_rule",
] as const;

export const CreateServerModelSchema = z
  .object({
    medusa_product_id: optionalText,
    medusa_variant_id: optionalText,
    brand: z.string().min(1),
    family: z.string().min(1),
    generation: z.string().min(1),
    model: z.string().min(1),
    public_name: z.string().min(1),
    slug: z.string().min(1),
    form_factor: z.string().min(1),
    chassis_type: z.string().min(1),
    drive_bays_front: z.number(),
    drive_bays_rear: z.number().optional(),
    drive_form_factor: z.string().min(1),
    supported_drive_interfaces: textArray,
    front_option_type: optionalText,
    backplane_type: z.string().min(1),
    cpu_socket: z.string().min(1),
    max_cpu: z.number(),
    ram_slots_total: z.number(),
    ram_slots_per_cpu: z.number(),
    max_ram_capacity: z.string().min(1),
    supported_ram_types: textArray,
    supported_ram_speeds: textArray,
    psu_type: z.string().min(1),
    cooling_profile: z.string().min(1),
    seo_title: z.string(),
    seo_description: z.string(),
    source_doc_reference: z.string(),
    enabled: z.boolean().optional(),
  })
  .passthrough();

export const UpdateServerModelSchema =
  CreateServerModelSchema.partial().passthrough();

export const CreateComponentSchema = z
  .object({
    type: z.enum(componentTypes),
    brand: z.string().min(1),
    model: z.string().min(1),
    part_number: optionalText,
    public_name: z.string().min(1),
    short_name: z.string().min(1),
    specs_json: jsonObject.optional().nullable(),
    normalized_specs_json: jsonObject.optional().nullable(),
    raw_specs_json: jsonObject.optional().nullable(),
    requirements_json: jsonObject.optional().nullable(),
    provides_json: jsonObject.optional().nullable(),
    consumes_json: jsonObject.optional().nullable(),
    applicability_json: jsonObject.optional().nullable(),
    source_json: jsonObject.optional().nullable(),
    schema_version: z.number().int().positive().optional(),
    normalization_status: z
      .enum(["normalized", "partially_normalized", "unmapped", "informational"])
      .optional(),
    price: z.number().optional(),
    cost: z.number().optional(),
    stock_qty: z.number().optional(),
    medusa_product_variant_id: optionalText,
    enabled: z.boolean().optional(),
  })
  .passthrough();

export const UpdateComponentSchema =
  CreateComponentSchema.partial().passthrough();

export const ApplicabilitySchema = z
  .object({
    brands: z.array(z.string()).optional(),
    families: z.array(z.string()).optional(),
    generations: z.array(z.string()).optional(),
    server_model_slugs: z.array(z.string()).optional(),
    chassis_types: z.array(z.string()).optional(),
    exclude_server_model_slugs: z.array(z.string()).optional(),
  })
  .passthrough();

export const UpdateComponentApplicabilitySchema = z
  .object({
    applicability: ApplicabilitySchema,
  })
  .passthrough();

const packScopeArray = z.array(z.string()).optional().nullable();

export const CreateComponentPackSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().optional(),
    description: optionalText,
    component_type: z.enum(componentTypes),
    brand_scope: packScopeArray,
    family_scope: packScopeArray,
    generation_scope: packScopeArray,
    chassis_scope: packScopeArray,
    tags_json: z
      .union([jsonObject, z.array(z.string())])
      .optional()
      .nullable(),
    applicability_template_json: jsonObject.optional().nullable(),
    pack_kind: z
      .enum(["candidate_pool", "assembly_bundle", "platform_template"])
      .optional(),
    defaults_json: jsonObject.optional().nullable(),
    schema_version: z.number().int().positive().optional(),
    enabled: z.boolean().optional(),
    source_doc_reference: optionalText,
  })
  .passthrough();

export const UpdateComponentPackSchema =
  CreateComponentPackSchema.partial().passthrough();

export const AddComponentToPackSchema = z
  .object({
    component_id: z.string().min(1),
    sort_order: z.number().optional(),
    enabled: z.boolean().optional(),
    note: optionalText,
  })
  .passthrough();

export const BulkAddComponentsToPackSchema = z
  .object({
    component_ids: z.array(z.string()).optional(),
    filters: jsonObject.optional(),
    note: optionalText,
  })
  .passthrough();

export const PackApplicabilityTargetSchema = z
  .object({
    target_scope: z.enum(packTargetScopes),
    target_values: z.array(z.string()).optional(),
    mode: z.enum(["merge", "replace"]).optional(),
  })
  .passthrough();

export const ApplyPackApplicabilitySchema = PackApplicabilityTargetSchema;
export const PreviewPackApplicabilitySchema = PackApplicabilityTargetSchema;
export const DetachPackApplicabilitySchema =
  PackApplicabilityTargetSchema.partial().passthrough();

export const ReorderPackItemsSchema = z
  .object({
    items: z.array(
      z.object({
        item_id: z.string(),
        sort_order: z.number(),
      }),
    ),
  })
  .passthrough();

export const CreateRuleSchema = z
  .object({
    name: z.string().min(1),
    enabled: z.boolean().optional(),
    priority: z.number().optional(),
    scope_type: z.enum(scopeTypes),
    scope_value: optionalText,
    category: z.enum(ruleCategories),
    rule_type: z.enum(ruleTypes),
    conditions_json: jsonObject.optional().nullable(),
    action_json: jsonObject.optional().nullable(),
    message: optionalText,
    admin_note: optionalText,
    source_doc_reference: optionalText,
    version: z.string().optional(),
  })
  .passthrough();

export const UpdateRuleSchema = CreateRuleSchema.partial().passthrough();
export const ReviewRuleSchema = z
  .object({ reviewed: z.boolean().optional() })
  .optional();
export const EnableRuleWithConfirmationSchema = z
  .object({
    confirmation: z.union([z.boolean(), z.string()]),
    reviewed: z.boolean().optional(),
  })
  .passthrough();

export const CreateRulePresetSchema = z
  .object({
    name: z.string().min(1),
    category: z.string().min(1),
    description: optionalText,
    conditions_template_json: jsonObject.optional().nullable(),
    action_template_json: jsonObject.optional().nullable(),
    enabled: z.boolean().optional(),
  })
  .passthrough();

export const UpdateRulePresetSchema =
  CreateRulePresetSchema.partial().passthrough();
export const CreateRuleFromPresetSchema = CreateRuleSchema.partial()
  .passthrough()
  .optional();

export const CreateHelpAnnotationSchema = z
  .object({
    key: z.string().min(1),
    page: z.string().min(1),
    target_type: z.string().min(1),
    component_type: optionalText,
    server_model_slug: optionalText,
    title: z.string().min(1),
    body: z.string().min(1),
    placement: z.string().optional(),
    icon: z.string().optional(),
    severity: z.string().optional(),
    sort_order: z.number().optional(),
    enabled: z.boolean().optional(),
    source_doc_reference: optionalText,
    metadata_json: jsonObject.optional().nullable(),
  })
  .passthrough();

export const UpdateHelpAnnotationSchema =
  CreateHelpAnnotationSchema.partial().passthrough();

export const SimulateConfigurationSchema = z
  .object({
    server_model_slug: z.string().optional(),
    server_model_id: z.string().optional(),
    selected_components: z.array(
      z.object({
        component_id: z.string(),
        quantity: z.number().int().positive().optional(),
        group_key: z.string().optional(),
        zone_id: z.string().optional(),
      }),
    ),
    storage_option_id: z.string().optional(),
    explicit_none: z.array(z.string()).optional(),
    mode: z
      .enum([
        "guided_check",
        "assisted_preview",
        "bulk_dry_run",
        "production_validation",
      ])
      .optional(),
    partial: z.boolean().optional(),
  })
  .passthrough();

export const CompatibilityReadinessSchema =
  SimulateConfigurationSchema.partial()
    .extend({
      mode: z.enum([
        "guided_check",
        "assisted_preview",
        "bulk_dry_run",
        "production_validation",
      ]),
      manifest: z.record(z.string(), z.unknown()).optional(),
    })
    .passthrough();

const mutationBase = {
  actor_context: jsonObject.optional(),
  return_to: z.string().optional(),
};
const propertyDefinitionMutation = z.object({
  entity_type: z.literal("property_definition"),
  data: z
    .object({
      key: z.string().min(1),
      label: z.string().min(1),
      description: optionalText,
      value_type: z.enum([
        "text",
        "number",
        "boolean",
        "enum",
        "reference",
        "list",
        "object",
      ]),
      unit: optionalText,
      allowed_values_json: z.unknown().optional().nullable(),
      reference_concept_type: optionalText,
      entity_scopes: z.array(z.string()).min(1),
      required: z.boolean().optional(),
      default_value_json: z.unknown().optional().nullable(),
      displayable: z.boolean().optional(),
      filterable: z.boolean().optional(),
      comparable: z.boolean().optional(),
      searchable: z.boolean().optional(),
      inheritable: z.boolean().optional(),
      affects_compatibility: z.boolean().optional(),
      fact_path: optionalText,
      validator_key: optionalText,
      schema_version: z.number().int().positive().optional(),
      usage_status: z
        .enum([
          "informational",
          "filterable",
          "comparable",
          "engine_mapped",
          "unmapped",
          "deprecated",
          "unmapped_compatibility_property",
        ])
        .optional(),
      lifecycle_status: z.enum(["draft", "active", "deprecated"]).optional(),
      source_policy_json: jsonObject.optional().nullable(),
      review_policy_json: jsonObject.optional().nullable(),
    })
    .passthrough(),
  ...mutationBase,
});
const conceptMutation = z.object({
  entity_type: z.literal("technology_concept"),
  data: z
    .object({
      concept_type_id: z.string().min(1),
      stable_key: z.string().min(1),
      display_name: z.string().min(1),
      vendor_scope: optionalText,
      normalized_attributes_json: jsonObject.optional().nullable(),
      source_json: jsonObject.optional().nullable(),
      lifecycle_status: z.enum(["draft", "active", "deprecated"]).optional(),
      schema_version: z.number().int().positive().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const relationMutation = z.object({
  entity_type: z.literal("technology_relation"),
  data: z
    .object({
      source_type: z.string().min(1),
      source_id: z.string().min(1),
      relation_type_id: z.string().min(1),
      target_type: z.string().min(1),
      target_id: z.string().min(1),
      quantity: z.number().positive().optional().nullable(),
      unit: optionalText,
      conditions_json: jsonObject.optional().nullable(),
      source_reference: optionalText,
      confidence: z.number().min(0).max(1).optional().nullable(),
      review_status: z.enum(["unreviewed", "verified", "rejected"]).optional(),
      enabled: z.boolean().optional(),
      schema_version: z.number().int().positive().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const platformMutation = z.object({
  entity_type: z.literal("technology_platform"),
  data: z
    .object({
      key: z.string().min(1),
      name: z.string().min(1),
      supported_concepts_json: z.unknown(),
      properties_json: jsonObject.optional().nullable(),
      source_json: jsonObject.optional().nullable(),
      review_status: z.enum(["draft", "verified", "deprecated"]).optional(),
      schema_version: z.number().int().positive().optional(),
      enabled: z.boolean().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const generationMutation = z.object({
  entity_type: z.literal("vendor_generation_template"),
  data: z
    .object({
      key: z.string().min(1),
      vendor: z.string().min(1),
      generation_label: z.string().min(1),
      architecture_variant: optionalText,
      technology_platform_id: z.string().min(1),
      inherited_properties_json: jsonObject.optional().nullable(),
      default_option_groups_json: z.unknown().optional().nullable(),
      source_json: jsonObject.optional().nullable(),
      review_status: z.enum(["draft", "verified", "deprecated"]).optional(),
      schema_version: z.number().int().positive().optional(),
      enabled: z.boolean().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const typeDefinitionMutation = z.object({
  entity_type: z.literal("component_type_definition"),
  data: z
    .object({
      key: z.string().min(1),
      name: z.string().min(1),
      description: optionalText,
      fields_schema_json: jsonObject,
      ui_schema_json: jsonObject.optional().nullable(),
      facts_mapping_json: jsonObject.optional().nullable(),
      validator_key: optionalText,
      compatibility_mode: z.enum(["validated", "informational"]).optional(),
      schema_version: z.number().int().positive().optional(),
      enabled: z.boolean().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const relationTypeMutation = z.object({
  entity_type: z.literal("relation_type_definition"),
  data: z
    .object({
      key: z.string().min(1),
      name: z.string().min(1),
      allowed_source_types_json: z.unknown(),
      allowed_target_types_json: z.unknown(),
      inverse_relation_key: optionalText,
      supports_quantity: z.boolean().optional(),
      supports_conditions: z.boolean().optional(),
      engine_mapping: optionalText,
      validator_key: optionalText,
      status: z
        .enum(["informational", "engine_mapped", "unmapped", "deprecated"])
        .optional(),
      schema_version: z.number().int().positive().optional(),
    })
    .passthrough(),
  ...mutationBase,
});
const directAssignmentMutation = z.object({
  entity_type: z.literal("server_model_component_assignment"),
  data: z
    .object({
      server_model_id: z.string().min(1),
      component_id: z.string().min(1),
      assignment_role: z.enum([
        "optional_choice",
        "required_component",
        "default_component",
        "auto_added_technical",
        "enablement_kit",
        "replacement_option",
      ]),
      selection_mode: z.enum([
        "visible",
        "advanced_only",
        "hidden_technical",
        "informational",
      ]),
      default_quantity: z.number().int().min(0).optional(),
      min_quantity: z.number().int().min(0).optional(),
      max_quantity: z.number().int().positive().optional(),
      enabled: z.boolean().optional(),
      sort_order: z.number().int().optional(),
      requirements_override_json: jsonObject.optional().nullable(),
      provides_override_json: jsonObject.optional().nullable(),
      consumes_override_json: jsonObject.optional().nullable(),
      conflicts_override_json: jsonObject.optional().nullable(),
      source_doc_reference: optionalText,
      assignment_source: z.string().min(1),
      notes: optionalText,
    })
    .passthrough(),
  ...mutationBase,
});
const optionGroupMutation = z.object({
  entity_type: z.literal("configurator_option_group"),
  data: z
    .object({
      key: z.string().min(1),
      title: z.string().min(1),
      scope_type: z.enum([
        "server_model",
        "technology_platform",
        "vendor_generation",
        "server_family",
      ]),
      scope_id: z.string().min(1),
      component_type: z.string().min(1),
      source_types_json: z
        .array(
          z.enum([
            "pack",
            "direct",
            "topology",
            "bundle",
            "auto_added",
            "built_in",
          ]),
        )
        .min(1),
      selection_cardinality: z.enum([
        "zero_or_one",
        "exactly_one",
        "zero_or_many",
        "one_or_many",
      ]),
      allow_none: z.boolean().optional(),
      none_label: optionalText,
      none_selected_by_default: z.boolean().optional(),
      min_quantity: z.number().int().min(0).optional(),
      max_quantity: z.number().int().positive().optional(),
      sort_order: z.number().int().optional(),
      advanced: z.boolean().optional(),
      help_text: optionalText,
      visibility_rules_json: jsonObject.optional().nullable(),
      schema_version: z.number().int().positive().optional(),
      enabled: z.boolean().optional(),
    })
    .passthrough(),
  ...mutationBase,
});

export const KnowledgeEntityMutationSchema = z.discriminatedUnion(
  "entity_type",
  [
    propertyDefinitionMutation,
    conceptMutation,
    relationMutation,
    platformMutation,
    generationMutation,
    typeDefinitionMutation,
    relationTypeMutation,
    directAssignmentMutation,
    optionGroupMutation,
  ],
);
export type KnowledgeEntityMutationBody = z.infer<
  typeof KnowledgeEntityMutationSchema
>;

export const SmartBuilderPreviewSchema = z
  .object({
    intent: z.enum([
      "alternatives",
      "unique_component",
      "assembly_bundle",
      "storage_configuration",
      "new_component_type",
      "import_list",
    ]),
    server_model_id: z.string().optional(),
    reuse_model_count: z.number().int().min(0).default(1),
    component_count: z.number().int().min(0).default(1),
    adds_resources: z
      .array(z.enum(["bays", "slots", "ports", "capability"]))
      .default([]),
    affects_compatibility: z.boolean().default(true),
    selected_components: z
      .array(
        z.object({
          component_id: z.string().min(1),
          quantity: z.number().int().positive().default(1),
          group_key: z.string().optional(),
          zone_id: z.string().optional(),
        }),
      )
      .default([]),
  })
  .passthrough();

const smartContext = {
  server_model_id: z.string().min(1),
  return_to: z.string().optional(),
  source_context: jsonObject.optional(),
};
const smartAssignment = z.object({
  assignment_role: z.enum([
    "optional_choice",
    "required_component",
    "default_component",
    "auto_added_technical",
    "enablement_kit",
    "replacement_option",
  ]),
  selection_mode: z.enum([
    "visible",
    "advanced_only",
    "hidden_technical",
    "informational",
  ]),
  default_quantity: z.number().int().min(0).default(0),
  min_quantity: z.number().int().min(0).default(0),
  max_quantity: z.number().int().positive().default(1),
  sort_order: z.number().int().default(100),
  assignment_source: z.string().min(1),
  source_doc_reference: optionalText,
  notes: optionalText,
  requirements_override_json: jsonObject.optional().nullable(),
  provides_override_json: jsonObject.optional().nullable(),
  consumes_override_json: jsonObject.optional().nullable(),
  conflicts_override_json: jsonObject.optional().nullable(),
});
const smartDirect = z.object({
  entity_kind: z.literal("direct_component"),
  component: CreateComponentSchema,
  assignment: smartAssignment,
  ...smartContext,
});
const smartPack = z.object({
  entity_kind: z.enum(["component_pack", "assembly_bundle"]),
  pack: CreateComponentPackSchema,
  component_ids: z.array(z.string().min(1)).min(1),
  assignment: z
    .object({
      scope_type: z.enum([
        "technology_platform",
        "vendor_generation",
        "server_family",
        "server_model",
        "chassis_variant",
        "storage_option",
      ]),
      scope_id: z.string().min(1),
      inheritance_behavior: z
        .enum(["inherit", "override", "exclude"])
        .default("inherit"),
      assignment_source: z.string().min(1),
      source_reference: optionalText,
    })
    .optional(),
  return_to: z.string().optional(),
  source_context: jsonObject.optional(),
});
const bayGroup = z.object({
  key: z.string().min(1),
  count: z.number().int().positive(),
  native_form_factor: z.string().min(1),
  accepted_form_factors: z.array(z.string()).default([]),
  adapter_component_id: z.string().optional(),
  numbering_start: z.number().int().min(0).default(0),
  hot_swap: z.boolean().default(false),
  zone_id: z.string().min(1),
  max_populated: z.number().int().positive().optional(),
  protocols: z.array(z.enum(["SAS", "SATA", "NVMe", "M.2"])).min(1),
});
const smartStorage = z.object({
  entity_kind: z.literal("storage_topology"),
  ...smartContext,
  cage: z.object({
    name: z.string().min(1),
    location: z.enum(["front", "rear", "internal", "mid"]),
    bay_groups: z.array(bayGroup).min(1),
    hot_swap: z.boolean().default(false),
    source_doc_reference: optionalText,
  }),
  backplane: z.object({
    name: z.string().min(1),
    supported_protocols: z.array(z.enum(["SAS", "SATA", "NVMe", "M.2"])).min(1),
    connector_types: z.array(z.string()).default([]),
    connection_mode: z.enum(["direct_attach", "expander", "hybrid"]),
    max_protocol_bays_json: jsonObject.optional().nullable(),
    lane_requirements_json: jsonObject.optional().nullable(),
    required_controller_capabilities_json: jsonObject.optional().nullable(),
    required_cables_json: jsonObject.optional().nullable(),
    provides_json: jsonObject.optional().nullable(),
    consumes_json: jsonObject.optional().nullable(),
    conflicts_json: jsonObject.optional().nullable(),
    source_doc_reference: optionalText,
  }),
  option: z.object({
    key: z.string().min(1),
    public_name: z.string().min(1),
    is_base: z.boolean().default(false),
    is_default: z.boolean().default(false),
    optional_components_json: jsonObject.optional().nullable(),
    required_bundles_json: z.unknown().optional().nullable(),
    conflicts_json: jsonObject.optional().nullable(),
    source_doc_reference: optionalText,
  }),
});
export const SmartBuilderApplySchema = z.discriminatedUnion("entity_kind", [
  smartDirect,
  smartPack,
  smartStorage,
]);
export const SmartBuilderDraftSchema = z.object({
  id: z.string().optional(),
  current_step: z.string().min(1),
  draft_payload_json: jsonObject,
  mode_hint: z.string().default("smart_component_pack"),
  status: z
    .enum(["draft", "ready", "applying", "completed", "failed", "abandoned"])
    .default("draft"),
});
export const ConvertDirectToPackSchema = z.object({
  assignment_id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  source_reference: z.string().optional().nullable(),
});

const coreIdentity = z
  .object({
    vendor: z.string(),
    family: z.string(),
    generation: z.string().optional(),
    model: z.string(),
    public_name: z.string(),
    slug: z.string(),
    form_factor: z.string(),
    chassis_type: z.string(),
    source_document: z.string(),
  })
  .passthrough();
const corePlatform = z
  .object({
    technology_platform_id: z.string(),
    vendor_generation_template_id: z.string(),
    server_family_id: z.string().optional(),
    inherited_pack_ids: z.array(z.string()).default([]),
    exclusions: z.array(z.string()).default([]),
    overrides: jsonObject.optional(),
  })
  .passthrough();
const coreCpu = z
  .object({
    socket_concept_id: z.string(),
    socket_quantity: z.number().int(),
    ownership: z.enum(["shared", "per_socket", "numa"]),
    tdp_limit_w: z.number().positive().nullable().optional(),
    cooling_limit: z.string().optional(),
    qualification_policy: z.string().optional(),
    suggested_pack_ids: z.array(z.string()).default([]),
  })
  .passthrough();
const coreMemory = z
  .object({
    technology_concept_id: z.string(),
    module_types: z.array(z.string()).default([]),
    slots_per_cpu: z.number().int(),
    channels_per_cpu: z.number().int().min(0),
    max_capacity_gb: z.number().positive().nullable().optional(),
    population_profiles: z.array(jsonObject).default([]),
    speed_limit_mhz: z.number().positive().nullable().optional(),
    suggested_pack_ids: z.array(z.string()).default([]),
  })
  .passthrough();
const coreStorage = z
  .object({
    chassis_variants: z
      .array(
        z
          .object({
            key: z.string(),
            name: z.string(),
            front_bays: z.number().int().min(0),
            rear_bays: z.number().int().min(0),
            drive_form_factor: z.string(),
            backplane_reference: z.string().optional(),
            properties: jsonObject.optional(),
          })
          .passthrough(),
      )
      .default([]),
    storage_option_ids: z.array(z.string()).default([]),
    protocols: z.array(z.string()).default([]),
    controller_component_ids: z.array(z.string()).default([]),
    suggested_drive_pack_ids: z.array(z.string()).default([]),
  })
  .passthrough();
const coreProperties = z
  .object({
    assignments: z
      .array(
        z.object({
          property_definition_id: z.string(),
          mode: z.enum([
            "direct",
            "inherited",
            "override",
            "disable",
            "unresolved_draft",
          ]),
          value: z.unknown().optional(),
          inherited_from_type: z.string().optional(),
          inherited_from_id: z.string().optional(),
        }),
      )
      .default([]),
  })
  .passthrough();
export const CoreServerDraftSchema = z
  .object({
    schema_version: z.number().int().positive().default(1),
    creation_method: z.enum([
      "scratch",
      "generation_template",
      "clone_model",
      "documentation",
      "continue_draft",
    ]),
    source_server_model_id: z.string().optional(),
    identity: coreIdentity,
    platform: corePlatform,
    cpu: coreCpu,
    memory: coreMemory,
    storage: coreStorage,
    expansion: z
      .object({
        risers: z.array(jsonObject).default([]),
        slots: z.array(jsonObject).default([]),
        ocp_slots: z.array(jsonObject).default([]),
        conflicts: z.array(jsonObject).default([]),
      })
      .passthrough(),
    power: z
      .object({
        psu_pack_ids: z.array(z.string()).default([]),
        max_watts: z.number().positive().nullable().optional(),
        psu_summary: z.string().optional(),
        cooling_mode: z.enum(["air", "performance_air", "liquid", "unknown"]),
        fan_pack_ids: z.array(z.string()).default([]),
        heatsink_pack_ids: z.array(z.string()).default([]),
        thermal_zones: z.array(jsonObject).default([]),
        conditions: z.array(jsonObject).default([]),
      })
      .passthrough(),
    network: z
      .object({
        embedded_component_ids: z.array(z.string()).default([]),
        nic_pack_ids: z.array(z.string()).default([]),
        management_concept_id: z.string(),
        boot_group_ids: z.array(z.string()).default([]),
        direct_component_ids: z.array(z.string()).default([]),
        bundle_ids: z.array(z.string()).default([]),
      })
      .passthrough(),
    optional_groups: z
      .object({ option_group_ids: z.array(z.string()).default([]) })
      .passthrough(),
    product_strategy: z.enum([
      "single_card_chassis_options",
      "separate_catalog_cards",
      "separate_products",
      "shared_technical_platform",
    ]),
    properties: coreProperties,
    simulation: z
      .object({
        representative_components: z
          .array(
            z.object({
              component_id: z.string(),
              quantity: z.number().int().positive(),
            }),
          )
          .default([]),
        explicit_none: z.array(z.string()).default([]),
        storage_option_ids: z.array(z.string()).default([]),
      })
      .passthrough(),
    review: z
      .object({
        reviewer: z.string(),
        notes: z.string().optional(),
        publication_confirmed: z.boolean().default(false),
      })
      .passthrough(),
    materialized_server_model_id: z.string().optional(),
    return_to: z.string().optional(),
  })
  .passthrough();
export const CoreWizardDraftSchema = z.object({
  id: z.string().optional(),
  current_step: z.number().int().min(1).max(14),
  draft: CoreServerDraftSchema,
  status: z.enum(["draft", "ready", "failed"]).default("draft"),
});
export const CoreWizardPreviewSchema = z.object({
  draft: CoreServerDraftSchema,
});
export const CoreWizardMaterializeSchema = z.object({
  session_id: z.string(),
  draft: CoreServerDraftSchema,
});
export const CoreWizardPublishSchema = z.object({
  session_id: z.string(),
  server_model_id: z.string(),
  draft: CoreServerDraftSchema,
  confirmation: z.literal("PUBLISH_VALIDATED_SERVER"),
});
export const ImpactAnalysisSchema = z.object({
  entity_type: z.enum([
    "property_definition",
    "technology_concept",
    "technology_relation",
    "pack_assignment",
  ]),
  entity_id: z.string().min(1),
});

const GeniusModeSchema = z.enum([
  "guided_manual",
  "assisted_draft",
  "bulk_apply",
]);
const GeniusDecisionSchema = z.enum([
  "suggested",
  "confirmed",
  "edited",
  "rejected",
  "unresolved",
]);
export const GeniusIntentSchema = z
  .object({
    mode: GeniusModeSchema.default("guided_manual"),
    launch_mode: z.enum([
      "quick_existing_platform",
      "new_model_existing_generation",
      "bootstrap_vendor_generation",
      "bootstrap_technology_platform",
      "clone_similar_server",
      "import_documentation_review",
      "resume_draft",
    ]),
    vendor: z.string().optional(),
    generation_label: z.string().optional(),
    platform_name: z.string().optional(),
    platform_key: z.string().optional(),
    socket: z.string().optional(),
    memory_technology: z.string().optional(),
    server_model: z.string().optional(),
    source_reference: z.string().optional(),
    source_type: z
      .enum(["manual", "document", "ai_suggestion", "import"])
      .default("manual"),
    confidence: z.number().min(0).max(1).default(0),
    reviewer: z.string().optional(),
    decisions: z.record(z.string(), GeniusDecisionSchema).default({}),
    property_assignments: z
      .array(
        z.object({
          id: z.string(),
          scope_type: z.string(),
          scope_id: z.string(),
          property_definition_id: z.string(),
          normalized_value: z.string(),
          unit: z.string().optional(),
          inheritance_behavior: z.string(),
          usage: z.string(),
          concept_id: z.string().optional(),
          relation_role: z.string().optional(),
          validator_key: z.string().optional(),
          provider_consumer: z.string().optional(),
          status: GeniusDecisionSchema,
        }),
      )
      .default([]),
  })
  .passthrough();
export const GeniusPlanSchema = z.object({ intent: GeniusIntentSchema });
export const GeniusSessionSchema = z.object({
  id: z.string().optional(),
  current_phase: z.number().int().min(0).max(15),
  intent: GeniusIntentSchema,
  state: jsonObject.default({}),
  status: z.enum(["draft", "ready", "failed", "abandoned"]).default("draft"),
});
export const GeniusManifestSaveSchema = z.object({
  id: z.string().optional(),
  session_id: z.string().min(1),
  intent: GeniusIntentSchema,
  confirmation: z.literal("SAVE_CONFIRMED_MANIFEST"),
});
export const GeniusBulkAdapterSchema = z.object({
  operation: z.enum(["dry_run", "apply"]),
  idempotency_key: z.string().min(8).max(200),
  manifest: jsonObject,
  approved_groups: z.array(z.string()).default([]),
});
export const GeniusAbandonSchema = z.object({
  session_id: z.string().min(1),
  confirmation: z.literal("ABANDON_GENIUS_DRAFT"),
});
export const PropertyCompletenessSchema = z.object({
  value_present: z.boolean(),
  unit_present: z.boolean(),
  affects_compatibility: z.boolean(),
  concept_present: z.boolean(),
  relation_present: z.boolean(),
  validator_present: z.boolean(),
  inherited_conflict: z.boolean(),
});

const TechnicalImportRecordSchema = z
  .object({
    source_id: z.string().min(1),
    kind: z.string().optional(),
    term: z.string().optional(),
    name: z.string().optional(),
    vendor: z.string().optional(),
    model: z.string().optional(),
    part_number: z.string().optional(),
    server_model_key: z.string().optional(),
    reusable: z.boolean().optional(),
    model_specific: z.boolean().optional(),
    required_kit: z.boolean().optional(),
    parts: z.array(z.unknown()).optional(),
    attributes: jsonObject.optional(),
    storage: jsonObject.optional(),
    optional_type: z.string().optional(),
    knowledge: jsonObject.optional(),
    source: jsonObject.optional(),
    confidence: z.number().min(0).max(1).optional(),
    commercial: jsonObject.optional(),
  })
  .passthrough();
export const ImportBatchCreateSchema = z.object({
  source_type: z.enum(["json", "csv", "document", "genius_manifest"]).default("json"),
  adapter_key: z.enum(["hpe", "dell", "supermicro"]),
  file_name: z.string().optional(),
  source_schema_version: z.number().int().positive().default(1),
  records: z.array(TechnicalImportRecordSchema).min(1).max(5000),
  previous_source_identities: z.array(z.string()).default([]),
  creation_manifest_id: z.string().optional(),
  wizard_session_id: z.string().optional(),
});
export const ImportBatchReviewSchema = z.object({
  review_status: z.enum(["approved", "rejected"]),
  rows: z.array(z.object({
    id: z.string(),
    review_status: z.enum(["approved", "edited", "rejected", "unresolved"]),
    classification_confirmed: z.string().optional(),
    normalized_payload: jsonObject.optional(),
  })).min(1),
});
export const ImportBatchDryRunSchema = z.object({
  approved_groups: z.array(z.string()).default([]),
});
export const ImportBatchApplySchema = z.object({
  idempotency_key: z.string().min(8).max(200),
  approved_groups: z.array(z.string()).default([]),
  confirmation: z.literal("APPLY_REVIEWED_TECHNICAL_IMPORT"),
});
export const ImportBatchRollbackSchema = z.object({
  confirmation: z.literal("ROLLBACK_TECHNICAL_IMPORT"),
});
export const ImportGeniusManifestSchema = z.object({
  adapter_key: z.enum(["hpe", "dell", "supermicro"]),
  creation_manifest_id: z.string().min(1),
  wizard_session_id: z.string().min(1),
  manifest: jsonObject,
});

const ReadySelectionSchema = z.object({
  component_id: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  group_key: z.string().optional(),
  zone_id: z.string().optional(),
});

export const ReadyConfigurationMutationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: optionalText,
  use_case: z.string().min(1).optional(),
  server_model_id: z.string().min(1).optional(),
  server_model_slug: z.string().min(1).optional(),
  selected_components: z.array(ReadySelectionSchema).optional(),
  explicit_none: z.array(z.string()).optional(),
  storage_option_id: optionalText,
  price_mode: z.enum(["fixed", "from", "request_quote"]).optional(),
  currency_code: optionalText,
  base_price: z.number().nonnegative().nullable().optional(),
  components_price: z.number().nonnegative().nullable().optional(),
  total_price: z.number().nonnegative().nullable().optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  media_json: jsonObject.nullable().optional(),
  seo_title: optionalText,
  seo_description: optionalText,
  source_json: jsonObject.nullable().optional(),
  review_json: jsonObject.nullable().optional(),
  source_configuration_id: optionalText,
  source_ready_configuration_id: optionalText,
  created_from: z.enum(["manual", "simulator", "user_configuration", "duplicate", "revalidation"]).optional(),
}).passthrough();

export const ReorderReadyConfigurationsSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sort_order: z.number().int() })).min(1),
});

export type SmartBuilderPreviewBody = z.infer<typeof SmartBuilderPreviewSchema>;
export type SmartBuilderApplyBody = z.infer<typeof SmartBuilderApplySchema>;
export type SmartBuilderDraftBody = z.infer<typeof SmartBuilderDraftSchema>;
export type ConvertDirectToPackBody = z.infer<typeof ConvertDirectToPackSchema>;
export type CoreServerDraftBody = z.infer<typeof CoreServerDraftSchema>;
export type CoreWizardDraftBody = z.infer<typeof CoreWizardDraftSchema>;
export type CoreWizardPreviewBody = z.infer<typeof CoreWizardPreviewSchema>;
export type CoreWizardMaterializeBody = z.infer<
  typeof CoreWizardMaterializeSchema
>;
export type CoreWizardPublishBody = z.infer<typeof CoreWizardPublishSchema>;
export type ImpactAnalysisBody = z.infer<typeof ImpactAnalysisSchema>;
export type GeniusIntentBody = z.infer<typeof GeniusIntentSchema>;
export type GeniusPlanBody = z.infer<typeof GeniusPlanSchema>;
export type GeniusSessionBody = z.infer<typeof GeniusSessionSchema>;
export type GeniusManifestSaveBody = z.infer<
  typeof GeniusManifestSaveSchema
>;
export type GeniusBulkAdapterBody = z.infer<typeof GeniusBulkAdapterSchema>;
export type GeniusAbandonBody = z.infer<typeof GeniusAbandonSchema>;
export type PropertyCompletenessBody = z.infer<
  typeof PropertyCompletenessSchema
>;
export type ImportBatchCreateBody = z.infer<typeof ImportBatchCreateSchema>;
export type ImportBatchReviewBody = z.infer<typeof ImportBatchReviewSchema>;
export type ImportBatchDryRunBody = z.infer<typeof ImportBatchDryRunSchema>;
export type ImportBatchApplyBody = z.infer<typeof ImportBatchApplySchema>;
export type ImportBatchRollbackBody = z.infer<typeof ImportBatchRollbackSchema>;
export type ImportGeniusManifestBody = z.infer<typeof ImportGeniusManifestSchema>;
export type ReadyConfigurationMutationBody = z.infer<typeof ReadyConfigurationMutationSchema>;
export type ReorderReadyConfigurationsBody = z.infer<typeof ReorderReadyConfigurationsSchema>;

export const UpdateQuoteRequestSchema = z.object({
  status: z.enum(["reviewing", "quoted", "accepted", "rejected", "expired", "converted"]),
  quoted_amount: z.number().nonnegative().optional(),
  currency_code: z.string().trim().length(3).transform((value) => value.toLowerCase()).optional(),
  quote_expires_at: z.coerce.date().optional(),
  medusa_order_id: z.string().min(1).max(160).optional(),
});

export type UpdateQuoteRequestBody = z.infer<typeof UpdateQuoteRequestSchema>;

export type CreateServerModelBody = z.infer<typeof CreateServerModelSchema>;
export type UpdateServerModelBody = z.infer<typeof UpdateServerModelSchema>;
export type CreateComponentBody = z.infer<typeof CreateComponentSchema>;
export type UpdateComponentBody = z.infer<typeof UpdateComponentSchema>;
export type UpdateComponentApplicabilityBody = z.infer<
  typeof UpdateComponentApplicabilitySchema
>;
export type CreateComponentPackBody = z.infer<typeof CreateComponentPackSchema>;
export type UpdateComponentPackBody = z.infer<typeof UpdateComponentPackSchema>;
export type AddComponentToPackBody = z.infer<typeof AddComponentToPackSchema>;
export type BulkAddComponentsToPackBody = z.infer<
  typeof BulkAddComponentsToPackSchema
>;
export type ApplyPackApplicabilityBody = z.infer<
  typeof ApplyPackApplicabilitySchema
>;
export type PreviewPackApplicabilityBody = z.infer<
  typeof PreviewPackApplicabilitySchema
>;
export type DetachPackApplicabilityBody = z.infer<
  typeof DetachPackApplicabilitySchema
>;
export type ReorderPackItemsBody = z.infer<typeof ReorderPackItemsSchema>;
export type CreateRuleBody = z.infer<typeof CreateRuleSchema>;
export type UpdateRuleBody = z.infer<typeof UpdateRuleSchema>;
export type ReviewRuleBody = z.infer<typeof ReviewRuleSchema>;
export type EnableRuleWithConfirmationBody = z.infer<
  typeof EnableRuleWithConfirmationSchema
>;
export type CreateRulePresetBody = z.infer<typeof CreateRulePresetSchema>;
export type UpdateRulePresetBody = z.infer<typeof UpdateRulePresetSchema>;
export type CreateRuleFromPresetBody = z.infer<
  typeof CreateRuleFromPresetSchema
>;
export type CreateHelpAnnotationBody = z.infer<
  typeof CreateHelpAnnotationSchema
>;
export type UpdateHelpAnnotationBody = z.infer<
  typeof UpdateHelpAnnotationSchema
>;
export type SimulateConfigurationBody = z.infer<
  typeof SimulateConfigurationSchema
>;
export type CompatibilityReadinessBody = z.infer<
  typeof CompatibilityReadinessSchema
>;
