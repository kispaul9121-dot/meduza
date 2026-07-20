import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { componentAppliesToModel } from "../../../../modules/server-configurator/applicability"
import { PackApplicabilityInput } from "./types"
import { detachApplicability, detectConflicts, matchingModels, mergeApplicability } from "./helpers"

async function packComponents(service: any, packId: string) {
  const items = await service.listComponentPackItems({ component_pack_id: packId, enabled: true }, { order: { sort_order: "ASC" } })
  const ids = items.map((item: any) => item.component_id)
  const components = ids.length ? await service.listComponents({ id: ids }) : []
  return { items, components }
}

export const previewPackApplicabilityStep = createStep(
  "preview-server-configurator-pack-applicability",
  async (input: PackApplicabilityInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const pack = await service.retrieveComponentPack(input.id)
    const { components } = await packComponents(service, input.id)
    const models = await service.listServerModels({ enabled: true })
    const target_models = matchingModels(models, input)
    const visible_components_by_model = target_models.map((model: any) => ({
      slug: model.slug,
      public_name: model.public_name,
      component_ids: components.filter((component: any) => componentAppliesToModel({
        ...component,
        specs_json: mergeApplicability(component, pack, input),
      }, model)).map((component: any) => component.id),
    }))
    return new StepResponse({
      component_pack: pack,
      target_models,
      components,
      visible_components_by_model,
      conflicts: detectConflicts(pack, components, target_models),
    })
  }
)

export const applyPackApplicabilityStep = createStep(
  "apply-server-configurator-pack-applicability",
  async (input: PackApplicabilityInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const pack = await service.retrieveComponentPack(input.id)
    const { components } = await packComponents(service, input.id)
    const previous: any[] = []
    const updated: any[] = []
    for (const component of components) {
      previous.push(component)
      updated.push(await service.updateComponents({
        id: component.id,
        specs_json: mergeApplicability(component, pack, input),
      }))
    }
    return new StepResponse({ updated: updated.length, components: updated }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    for (const component of previous || []) await service.updateComponents(component)
  }
)

export const detachPackApplicabilityStep = createStep(
  "detach-server-configurator-pack-applicability",
  async (input: { id: string }, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.retrieveComponentPack(input.id)
    const { components } = await packComponents(service, input.id)
    const previous: any[] = []
    const updated: any[] = []
    for (const component of components) {
      previous.push(component)
      updated.push(await service.updateComponents({
        id: component.id,
        specs_json: detachApplicability(component, input.id),
      }))
    }
    return new StepResponse({ updated: updated.length, components: updated }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    for (const component of previous || []) await service.updateComponents(component)
  }
)
