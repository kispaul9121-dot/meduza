import { z } from "@medusajs/framework/zod"

export const SelectedConfiguredServerComponentSchema = z.object({
  component_id: z.string().min(1).max(160),
  quantity: z.number().int().positive().max(10_000).default(1),
  type: z.string().max(100).optional(),
})

export const AddConfiguredServerToCartSchema = z.object({
  cart_id: z.string().min(1).max(160).optional(),
  server_model_slug: z.string().min(1).max(160),
  selected_components: z.array(SelectedConfiguredServerComponentSchema).max(200).default([]),
  quantity: z.number().int().positive().max(10_000).default(1),
  customer_email: z.string().email().max(320).optional(),
  pricing_mode: z.literal("calculated").optional(),
  storage_option_id: z.string().min(1).max(160).optional(),
  explicit_none: z.array(z.string().min(1).max(160)).max(50).default([]),
  ready_configuration_id: z.string().min(1).max(160).optional(),
  ready_configuration_version: z.number().int().positive().optional(),
  ready_snapshot_hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
})

export const RequestConfigurationQuoteSchema = z.object({
  cart_id: z.string().min(1).max(160).optional(),
  server_model_slug: z.string().min(1).max(160),
  selected_components: z.array(SelectedConfiguredServerComponentSchema).max(200).default([]),
  storage_option_id: z.string().min(1).max(160).optional(),
  explicit_none: z.array(z.string().min(1).max(160)).max(50).default([]),
  ready_configuration_id: z.string().min(1).max(160).optional(),
  ready_configuration_version: z.number().int().positive().optional(),
  ready_snapshot_hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  company_name: z.string().trim().min(2).max(200),
  contact_name: z.string().trim().min(2).max(200),
  email: z.string().email().max(320),
  phone: z.string().trim().max(80).optional(),
  quantity: z.number().int().positive().max(10_000).default(1),
  comments: z.string().trim().max(4_000).optional(),
})

export const ValidateConfiguredCartSchema = z.object({
  cart_id: z.string().min(1).max(160),
})

export const UpdateConfiguredCartLineSchema = z.object({
  cart_id: z.string().min(1).max(160),
  quantity: z.number().int().positive().max(10_000),
})

export const ValidateServerConfigurationSchema = z.object({
  server_model_slug: z.string().min(1).optional(),
  server_model_id: z.string().min(1).optional(),
  storage_option_id: z.string().min(1).optional(),
  selected_components: z.array(SelectedConfiguredServerComponentSchema).default([]),
  explicit_none: z.array(z.string().min(1)).default([]),
  mode: z.enum(["guided_check", "assisted_preview", "bulk_dry_run", "production_validation"]).default("production_validation"),
  partial: z.boolean().default(false),
}).passthrough().refine((value) => Boolean(value.server_model_slug || value.server_model_id), {
  message: "server_model_slug or server_model_id is required",
})

export type AddConfiguredServerToCartSchemaType = z.infer<typeof AddConfiguredServerToCartSchema>
export type RequestConfigurationQuoteSchemaType = z.infer<typeof RequestConfigurationQuoteSchema>
export type ValidateConfiguredCartSchemaType = z.infer<typeof ValidateConfiguredCartSchema>
export type UpdateConfiguredCartLineSchemaType = z.infer<typeof UpdateConfiguredCartLineSchema>
export type ValidateServerConfigurationSchemaType = z.infer<typeof ValidateServerConfigurationSchema>
