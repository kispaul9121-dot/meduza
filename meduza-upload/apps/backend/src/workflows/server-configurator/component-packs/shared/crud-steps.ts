import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { PackIdInput, PackUpdateInput } from "./types"
import { omitSystem, packSlug } from "./helpers"

export const createComponentPackStep = createStep(
  "create-server-configurator-component-pack",
  async (input: Record<string, any>, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const pack = await service.createComponentPacks({
      ...input,
      slug: input.slug || packSlug(input.name),
      enabled: input.enabled ?? true,
    })
    return new StepResponse({ component_pack: pack }, pack.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponentPacks(id)
  }
)

export const updateComponentPackStep = createStep(
  "update-server-configurator-component-pack",
  async (input: PackUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveComponentPack(input.id)
    const data = {
      ...input.data,
      slug: input.data.slug || (input.data.name ? packSlug(String(input.data.name)) : previous.slug),
    }
    const pack = await service.updateComponentPacks({ id: input.id, ...data })
    return new StepResponse({ component_pack: pack }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateComponentPacks(previous)
  }
)

export const deleteComponentPackStep = createStep(
  "delete-server-configurator-component-pack",
  async (input: PackIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponentPackItems({ component_pack_id: input.id })
    await service.deleteComponentPacks(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)

export const duplicateComponentPackStep = createStep(
  "duplicate-server-configurator-component-pack",
  async (input: PackIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const original = await service.retrieveComponentPack(input.id)
    const pack = await service.createComponentPacks({
      ...omitSystem(original),
      name: `${original.name} Copy`,
      slug: `${original.slug}-copy-${Date.now()}`,
      enabled: false,
    })
    const items = await service.listComponentPackItems({ component_pack_id: input.id })
    await service.createComponentPackItems(items.map((item: any) => ({
      component_pack_id: pack.id,
      component_id: item.component_id,
      sort_order: item.sort_order,
      enabled: item.enabled,
      note: item.note,
    })))
    return new StepResponse({ component_pack: pack }, pack.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponentPackItems({ component_pack_id: id })
    await service.deleteComponentPacks(id)
  }
)
