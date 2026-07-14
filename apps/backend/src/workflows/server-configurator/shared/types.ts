export type JsonRecord = Record<string, unknown>

export type EntityPayload = JsonRecord

export type EntityIdInput = {
  id: string
}

export type EntityUpdateInput = EntityIdInput & {
  data: EntityPayload
}

export type ComponentApplicabilityInput = EntityIdInput & {
  applicability: {
    brands?: string[]
    families?: string[]
    generations?: string[]
    server_model_slugs?: string[]
    chassis_types?: string[]
    exclude_server_model_slugs?: string[]
  }
}

export type EnableRuleWithConfirmationInput = EntityIdInput & {
  confirmation: boolean | string
  reviewed?: boolean
}

export type CreateRuleFromPresetInput = EntityIdInput & {
  data?: EntityPayload
}
