import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator"
import { previewApplicability } from "../../../modules/server-configurator/applicability"
import {
  ComponentApplicabilityInput,
  CreateRuleFromPresetInput,
  EnableRuleWithConfirmationInput,
  EntityIdInput,
  EntityPayload,
  EntityUpdateInput,
} from "./types"

const draftConfirmation = "This rule was imported from Payloud 2 as a draft. It may use legacy facts/operators. Enable only after it was normalized and tested in Rule Simulator."

function omitSystemFields(row: Record<string, unknown>) {
  const { id, created_at, updated_at, deleted_at, ...copy } = row
  return copy
}

function isImportedDraft(rule: Record<string, unknown>) {
  const text = [rule.admin_note, rule.source_doc_reference].filter(Boolean).join(" ").toLowerCase()
  return !rule.enabled && (text.includes("imported from payloud 2 as draft") || text.includes("pauloud 2") || text.includes("payloud 2"))
}

export const createServerModelStep = createStep(
  "create-server-configurator-model",
  async (input: EntityPayload, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const model = await service.createServerModels(input)
    return new StepResponse({ model }, model.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteServerModels(id)
  }
)

export const updateServerModelStep = createStep(
  "update-server-configurator-model",
  async (input: EntityUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveServerModel(input.id)
    const model = await service.updateServerModels({ id: input.id, ...input.data })
    return new StepResponse({ model }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateServerModels(previous)
  }
)

export const deleteServerModelStep = createStep(
  "delete-server-configurator-model",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteServerModels(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)

export const duplicateServerModelStep = createStep(
  "duplicate-server-configurator-model",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const original = await service.retrieveServerModel(input.id)
    const model = await service.createServerModels({
      ...omitSystemFields(original),
      public_name: `${original.public_name} Copy`,
      slug: `${original.slug}-copy-${Date.now()}`,
      enabled: false,
    })
    return new StepResponse({ model }, model.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteServerModels(id)
  }
)

export const createComponentStep = createStep(
  "create-server-configurator-component",
  async (input: EntityPayload, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const component = await service.createComponents(input)
    return new StepResponse({ component }, component.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponents(id)
  }
)

export const updateComponentStep = createStep(
  "update-server-configurator-component",
  async (input: EntityUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveComponent(input.id)
    const component = await service.updateComponents({ id: input.id, ...input.data })
    return new StepResponse({ component }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateComponents(previous)
  }
)

export const deleteComponentStep = createStep(
  "delete-server-configurator-component",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponents(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)

export const duplicateComponentStep = createStep(
  "duplicate-server-configurator-component",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const original = await service.retrieveComponent(input.id)
    const component = await service.createComponents({
      ...omitSystemFields(original),
      public_name: `${original.public_name} Copy`,
      short_name: `${original.short_name} Copy`,
      enabled: false,
    })
    return new StepResponse({ component }, component.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteComponents(id)
  }
)

export const updateComponentApplicabilityStep = createStep(
  "update-server-configurator-component-applicability",
  async (input: ComponentApplicabilityInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const component = await service.retrieveComponent(input.id)
    const updated = await service.updateComponents({
      id: input.id,
      specs_json: { ...(component.specs_json || {}), applicability: input.applicability },
    })
    const models = await service.listServerModels({ enabled: true })
    return new StepResponse({ component: updated, preview: previewApplicability(updated, models) }, component)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateComponents(previous)
  }
)

export const createRuleStep = createStep(
  "create-server-configurator-rule",
  async (input: EntityPayload, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const rule = await service.createCompatibilityRules(input)
    return new StepResponse({ rule }, rule.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteCompatibilityRules(id)
  }
)

export const updateRuleStep = createStep(
  "update-server-configurator-rule",
  async (input: EntityUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveCompatibilityRule(input.id)
    const rule = await service.updateCompatibilityRules({ id: input.id, ...input.data })
    return new StepResponse({ rule }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateCompatibilityRules(previous)
  }
)

export const deleteRuleStep = createStep(
  "delete-server-configurator-rule",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteCompatibilityRules(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)

export const duplicateRuleStep = createStep(
  "duplicate-server-configurator-rule",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const original = await service.retrieveCompatibilityRule(input.id)
    const rule = await service.createCompatibilityRules({
      ...omitSystemFields(original),
      name: `${original.name} Copy`,
      enabled: false,
      admin_note: [original.admin_note, "Duplicated for review"].filter(Boolean).join(" | "),
    })
    return new StepResponse({ rule }, rule.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteCompatibilityRules(id)
  }
)

export const reviewRuleStep = createStep(
  "review-server-configurator-rule",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveCompatibilityRule(input.id)
    const rule = await service.updateCompatibilityRules({
      id: input.id,
      action_json: { ...(previous.action_json || {}), reviewed: true, reviewed_at: new Date().toISOString() },
    })
    return new StepResponse({ rule }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateCompatibilityRules(previous)
  }
)

export const enableRuleWithConfirmationStep = createStep(
  "enable-server-configurator-rule-with-confirmation",
  async (input: EnableRuleWithConfirmationInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveCompatibilityRule(input.id)
    if (isImportedDraft(previous) && input.confirmation !== true && input.confirmation !== draftConfirmation) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Draft rule confirmation is required.")
    }
    const rule = await service.updateCompatibilityRules({
      id: input.id,
      enabled: true,
      action_json: {
        ...(previous.action_json || {}),
        reviewed: Boolean(input.reviewed) || true,
        normalized_confirmed: true,
        enabled_from_import_review_at: new Date().toISOString(),
      },
    })
    return new StepResponse({ rule, confirmation: draftConfirmation }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateCompatibilityRules(previous)
  }
)

export const createRulePresetStep = createStep(
  "create-server-configurator-rule-preset",
  async (input: EntityPayload, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const preset = await service.createRulePresets(input)
    return new StepResponse({ preset }, preset.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteRulePresets(id)
  }
)

export const updateRulePresetStep = createStep(
  "update-server-configurator-rule-preset",
  async (input: EntityUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveRulePreset(input.id)
    const preset = await service.updateRulePresets({ id: input.id, ...input.data })
    return new StepResponse({ preset }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateRulePresets(previous)
  }
)

export const deleteRulePresetStep = createStep(
  "delete-server-configurator-rule-preset",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteRulePresets(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)

export const duplicateRulePresetStep = createStep(
  "duplicate-server-configurator-rule-preset",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const original = await service.retrieveRulePreset(input.id)
    const preset = await service.createRulePresets({ ...omitSystemFields(original), name: `${original.name} Copy`, enabled: false })
    return new StepResponse({ preset }, preset.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteRulePresets(id)
  }
)

export const createRuleFromPresetStep = createStep(
  "create-server-configurator-rule-from-preset",
  async (input: CreateRuleFromPresetInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const preset = await service.retrieveRulePreset(input.id)
    const data = input.data || {}
    const rule = await service.createCompatibilityRules({
      name: data.name || preset.name,
      enabled: false,
      priority: data.priority || 100,
      scope_type: data.scope_type || "global",
      scope_value: data.scope_value || null,
      category: data.category || preset.category,
      rule_type: data.rule_type || "warning",
      conditions_json: data.conditions_json || preset.conditions_template_json || {},
      action_json: data.action_json || preset.action_template_json || {},
      message: data.message || preset.description || null,
      admin_note: `Created from preset ${preset.id}`,
      source_doc_reference: data.source_doc_reference || null,
      version: "1",
    })
    return new StepResponse({ rule }, rule.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteCompatibilityRules(id)
  }
)

export const createHelpAnnotationStep = createStep(
  "create-server-configurator-help-annotation",
  async (input: EntityPayload, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const annotation = await service.createHelpAnnotations(input)
    return new StepResponse({ annotation }, annotation.id)
  },
  async (id, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteHelpAnnotations(id)
  }
)

export const updateHelpAnnotationStep = createStep(
  "update-server-configurator-help-annotation",
  async (input: EntityUpdateInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    const previous = await service.retrieveHelpAnnotation(input.id)
    const annotation = await service.updateHelpAnnotations({ id: input.id, ...input.data })
    return new StepResponse({ annotation }, previous)
  },
  async (previous, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.updateHelpAnnotations(previous)
  }
)

export const deleteHelpAnnotationStep = createStep(
  "delete-server-configurator-help-annotation",
  async (input: EntityIdInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any
    await service.deleteHelpAnnotations(input.id)
    return new StepResponse({ id: input.id, deleted: true })
  }
)
