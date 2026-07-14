import { z } from "zod"

export const SelectedConfiguredServerComponentSchema = z.object({
  component_id: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  type: z.string().optional(),
})

export const AddConfiguredServerToCartSchema = z.object({
  cart_id: z.string().min(1).optional(),
  server_model_slug: z.string().min(1),
  selected_components: z.array(SelectedConfiguredServerComponentSchema).default([]),
  quantity: z.number().int().positive().default(1),
  customer_email: z.string().email().optional(),
  pricing_mode: z.enum(["calculated", "request_quote"]).optional(),
})

export type AddConfiguredServerToCartSchemaType = z.infer<typeof AddConfiguredServerToCartSchema>
