export type PackTargetScope =
  | "global"
  | "brand"
  | "generation"
  | "family"
  | "server_model"
  | "chassis_type"

export type PackApplicabilityInput = {
  id: string
  target_scope: PackTargetScope
  target_values?: string[]
  mode?: "merge" | "replace"
}

export type PackIdInput = {
  id: string
}

export type PackUpdateInput = PackIdInput & {
  data: Record<string, unknown>
}

export type AddPackItemInput = PackIdInput & {
  component_id: string
  sort_order?: number
  enabled?: boolean
  note?: string | null
}

export type RemovePackItemInput = PackIdInput & {
  item_id: string
}

export type BulkAddPackItemsInput = PackIdInput & {
  component_ids?: string[]
  filters?: Record<string, unknown>
  note?: string | null
}

export type ReorderPackItemsInput = PackIdInput & {
  items: {
    item_id: string
    sort_order: number
  }[]
}
