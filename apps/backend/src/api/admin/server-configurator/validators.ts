import { z } from "zod"

const jsonObject = z.record(z.string(), z.unknown())
const optionalText = z.string().nullable().optional()
const textArray = z.array(z.string()).optional().nullable()

const componentTypes = ["cpu", "ram", "drive", "raid", "nic", "psu", "riser", "backplane", "rails", "cable", "cooling", "license", "service"] as const
const scopeTypes = ["global", "brand", "generation", "family", "server_model", "chassis_variant", "component"] as const
const packTargetScopes = ["global", "brand", "generation", "family", "server_model", "chassis_type"] as const
const ruleCategories = ["cpu", "ram", "storage", "raid", "nic", "psu", "riser", "cooling", "backplane"] as const
const ruleTypes = ["allow", "block", "require", "limit", "warning", "downgrade", "auto_add", "price_rule"] as const

export const CreateServerModelSchema = z.object({
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
}).passthrough()

export const UpdateServerModelSchema = CreateServerModelSchema.partial().passthrough()

export const CreateComponentSchema = z.object({
  type: z.enum(componentTypes),
  brand: z.string().min(1),
  model: z.string().min(1),
  part_number: optionalText,
  public_name: z.string().min(1),
  short_name: z.string().min(1),
  specs_json: jsonObject.optional().nullable(),
  price: z.number().optional(),
  cost: z.number().optional(),
  stock_qty: z.number().optional(),
  medusa_product_variant_id: optionalText,
  enabled: z.boolean().optional(),
}).passthrough()

export const UpdateComponentSchema = CreateComponentSchema.partial().passthrough()

export const ApplicabilitySchema = z.object({
  brands: z.array(z.string()).optional(),
  families: z.array(z.string()).optional(),
  generations: z.array(z.string()).optional(),
  server_model_slugs: z.array(z.string()).optional(),
  chassis_types: z.array(z.string()).optional(),
  exclude_server_model_slugs: z.array(z.string()).optional(),
}).passthrough()

export const UpdateComponentApplicabilitySchema = z.object({
  applicability: ApplicabilitySchema,
}).passthrough()

const packScopeArray = z.array(z.string()).optional().nullable()

export const CreateComponentPackSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: optionalText,
  component_type: z.enum(componentTypes),
  brand_scope: packScopeArray,
  family_scope: packScopeArray,
  generation_scope: packScopeArray,
  chassis_scope: packScopeArray,
  tags_json: z.union([jsonObject, z.array(z.string())]).optional().nullable(),
  applicability_template_json: jsonObject.optional().nullable(),
  enabled: z.boolean().optional(),
  source_doc_reference: optionalText,
}).passthrough()

export const UpdateComponentPackSchema = CreateComponentPackSchema.partial().passthrough()

export const AddComponentToPackSchema = z.object({
  component_id: z.string().min(1),
  sort_order: z.number().optional(),
  enabled: z.boolean().optional(),
  note: optionalText,
}).passthrough()

export const BulkAddComponentsToPackSchema = z.object({
  component_ids: z.array(z.string()).optional(),
  filters: jsonObject.optional(),
  note: optionalText,
}).passthrough()

export const PackApplicabilityTargetSchema = z.object({
  target_scope: z.enum(packTargetScopes),
  target_values: z.array(z.string()).optional(),
  mode: z.enum(["merge", "replace"]).optional(),
}).passthrough()

export const ApplyPackApplicabilitySchema = PackApplicabilityTargetSchema
export const PreviewPackApplicabilitySchema = PackApplicabilityTargetSchema
export const DetachPackApplicabilitySchema = PackApplicabilityTargetSchema.partial().passthrough()

export const ReorderPackItemsSchema = z.object({
  items: z.array(z.object({
    item_id: z.string(),
    sort_order: z.number(),
  })),
}).passthrough()

export const CreateRuleSchema = z.object({
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
}).passthrough()

export const UpdateRuleSchema = CreateRuleSchema.partial().passthrough()
export const ReviewRuleSchema = z.object({ reviewed: z.boolean().optional() }).optional()
export const EnableRuleWithConfirmationSchema = z.object({
  confirmation: z.union([z.boolean(), z.string()]),
  reviewed: z.boolean().optional(),
}).passthrough()

export const CreateRulePresetSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: optionalText,
  conditions_template_json: jsonObject.optional().nullable(),
  action_template_json: jsonObject.optional().nullable(),
  enabled: z.boolean().optional(),
}).passthrough()

export const UpdateRulePresetSchema = CreateRulePresetSchema.partial().passthrough()
export const CreateRuleFromPresetSchema = CreateRuleSchema.partial().passthrough().optional()

export const CreateHelpAnnotationSchema = z.object({
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
}).passthrough()

export const UpdateHelpAnnotationSchema = CreateHelpAnnotationSchema.partial().passthrough()

export const SimulateConfigurationSchema = z.object({
  server_model_slug: z.string().optional(),
  server_model_id: z.string().optional(),
  selected_components: z.array(z.object({
    component_id: z.string(),
    quantity: z.number().optional(),
  })),
}).passthrough()

export type CreateServerModelBody = z.infer<typeof CreateServerModelSchema>
export type UpdateServerModelBody = z.infer<typeof UpdateServerModelSchema>
export type CreateComponentBody = z.infer<typeof CreateComponentSchema>
export type UpdateComponentBody = z.infer<typeof UpdateComponentSchema>
export type UpdateComponentApplicabilityBody = z.infer<typeof UpdateComponentApplicabilitySchema>
export type CreateComponentPackBody = z.infer<typeof CreateComponentPackSchema>
export type UpdateComponentPackBody = z.infer<typeof UpdateComponentPackSchema>
export type AddComponentToPackBody = z.infer<typeof AddComponentToPackSchema>
export type BulkAddComponentsToPackBody = z.infer<typeof BulkAddComponentsToPackSchema>
export type ApplyPackApplicabilityBody = z.infer<typeof ApplyPackApplicabilitySchema>
export type PreviewPackApplicabilityBody = z.infer<typeof PreviewPackApplicabilitySchema>
export type DetachPackApplicabilityBody = z.infer<typeof DetachPackApplicabilitySchema>
export type ReorderPackItemsBody = z.infer<typeof ReorderPackItemsSchema>
export type CreateRuleBody = z.infer<typeof CreateRuleSchema>
export type UpdateRuleBody = z.infer<typeof UpdateRuleSchema>
export type ReviewRuleBody = z.infer<typeof ReviewRuleSchema>
export type EnableRuleWithConfirmationBody = z.infer<typeof EnableRuleWithConfirmationSchema>
export type CreateRulePresetBody = z.infer<typeof CreateRulePresetSchema>
export type UpdateRulePresetBody = z.infer<typeof UpdateRulePresetSchema>
export type CreateRuleFromPresetBody = z.infer<typeof CreateRuleFromPresetSchema>
export type CreateHelpAnnotationBody = z.infer<typeof CreateHelpAnnotationSchema>
export type UpdateHelpAnnotationBody = z.infer<typeof UpdateHelpAnnotationSchema>
export type SimulateConfigurationBody = z.infer<typeof SimulateConfigurationSchema>
