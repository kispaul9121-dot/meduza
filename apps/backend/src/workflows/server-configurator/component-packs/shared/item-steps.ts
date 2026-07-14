import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { AddPackItemInput, BulkAddPackItemsInput, RemovePackItemInput, ReorderPackItemsInput } from "./types"
import { componentMatchesFilters } from "./helpers"

async function existingItemIds(service: any, packId: string) {
  const items = await service.listComponentPackItems({ component_pack_id: packId })
  return new Set(items.map((item: any) => item.component_id))
}

export const addComponentToPackStep = createStep(
  "add-server-configurator-component-to-pack",
  async (input: AddPackItemInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.retrieveComponentPack(input.id)
    await service.retrieveComponent(input.component_id)
    const existing = await existingItemIds(service, input.id)
    if (existing.has(input.component_id)) return new StepResponse({ skipped: true, item: null }, null)
    const item = await service.createComponentPackItems({
      component_pack_id: input.id,
      component_id: input.component_id,
      sort_order: input.sort_order ?? 100,
      enabled: input.enabled ?? true,
      note: input.note || null,
    })
    return new StepResponse({ skipped: false, item }, item.id)
  },
  async (id, { container }) => {
    if (!id) return
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponentPackItems(id)
  }
)

export const removeComponentFromPackStep = createStep(
  "remove-server-configurator-component-from-pack",
  async (input: RemovePackItemInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponentPackItems(input.item_id)
    return new StepResponse({ item_id: input.item_id, deleted: true })
  }
)

export const bulkAddComponentsToPackStep = createStep(
  "bulk-add-server-configurator-components-to-pack",
  async (input: BulkAddPackItemsInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const pack = await service.retrieveComponentPack(input.id)
    const existing = await existingItemIds(service, input.id)
    const components = await service.listComponents({}, { take: 10000 })
    const explicit = new Set(input.component_ids || [])
    const matches = components.filter((component: any) => {
      const byId = explicit.size ? explicit.has(component.id) : true
      return byId && component.type === pack.component_type && componentMatchesFilters(component, input.filters || {})
    })
    const created: any[] = []
    for (const component of matches) {
      if (existing.has(component.id)) continue
      const item = await service.createComponentPackItems({
        component_pack_id: input.id,
        component_id: component.id,
        sort_order: 100 + created.length,
        enabled: true,
        note: input.note || null,
      })
      created.push(item)
    }
    return new StepResponse({ added: created.length, items: created }, created.map((item: any) => item.id))
  },
  async (ids, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    if (Array.isArray(ids) && ids.length) await service.deleteComponentPackItems(ids)
  }
)

export const reorderPackItemsStep = createStep(
  "reorder-server-configurator-pack-items",
  async (input: ReorderPackItemsInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous: any[] = []
    for (const row of input.items) {
      const item = await service.retrieveComponentPackItem(row.item_id)
      previous.push(item)
      await service.updateComponentPackItems({ id: row.item_id, sort_order: row.sort_order })
    }
    return new StepResponse({ updated: input.items.length }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    for (const item of previous || []) await service.updateComponentPackItems(item)
  }
)
