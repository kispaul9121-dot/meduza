import { MedusaService } from "@medusajs/framework/utils"
import Component from "./models/component"
import ComponentPack from "./models/component-pack"
import ComponentPackItem from "./models/component-pack-item"
import CompatibilityRule from "./models/compatibility-rule"
import Configuration from "./models/configuration"
import ConfigurationItem from "./models/configuration-item"
import HelpAnnotation from "./models/help-annotation"
import RulePreset from "./models/rule-preset"
import ServerModel from "./models/server-model"
import AdminAuditEvent from "./models/admin-audit-event"
import ReadyConfiguration from "./models/ready-configuration"
import ReadyConfigurationVersion from "./models/ready-configuration-version"
import QuoteRequest from "./models/quote-request"
import {
  ImportApplyAttempt,
  ImportBatch,
  ImportStagedRecord,
} from "./models/import-pipeline"
import {
  BackplaneVariant,
  CapabilityProfile,
  ChassisVariant,
  ComponentTypeDefinition,
  ConceptAlias,
  ConfiguratorOptionGroup,
  CreationManifest,
  CreationWizardSession,
  DraftDependencyNode,
  PackAssignment,
  PropertyAssignment,
  PropertyDefinition,
  PropertyLinkRequirement,
  PropertyValue,
  RelationTypeDefinition,
  ServerFamily,
  ServerModelComponentAssignment,
  ServerStorageOption,
  StorageCageDefinition,
  StorageTopology,
  TechnologyConcept,
  TechnologyConceptType,
  TechnologyPlatform,
  TechnologyRelation,
  VendorGenerationTemplate,
} from "./models/domain-registry"
import { calculateDomainCoverage } from "./domain-contracts"
import { buildOptionResponse, CompatibilityData, SelectedComponentInput, validateCompatibility, validateReadiness, ValidationMode } from "./engine"
import { validateCatalogPropertyIndex } from "./catalog-query"
import { buildStorageChoices, buildStorefrontGroups } from "./storefront-presentation"

function scopeChain(model: any, chassisVariants: any[], storageOptions: any[], storageOptionId?: string) {
  return [
    { type: "global", id: "global" },
    model.technology_platform_id && { type: "technology_platform", id: model.technology_platform_id },
    model.vendor_generation_template_id && { type: "vendor_generation", id: model.vendor_generation_template_id },
    model.server_family_id && { type: "server_family", id: model.server_family_id },
    { type: "server_model", id: model.id },
    ...chassisVariants.filter((item) => item.server_model_id === model.id).map((item) => ({ type: "chassis_variant", id: item.id })),
    ...storageOptions.filter((item) => item.server_model_id === model.id && (!storageOptionId || item.id === storageOptionId)).map((item) => ({ type: "storage_option", id: item.id })),
  ].filter(Boolean) as Array<{ type: string; id: string }>
}

class ServerConfiguratorModuleService extends MedusaService({
  ServerModel,
  Component,
  ComponentPack,
  ComponentPackItem,
  CompatibilityRule,
  RulePreset,
  Configuration,
  ConfigurationItem,
  HelpAnnotation,
  ComponentTypeDefinition,
  PropertyDefinition,
  PropertyValue,
  TechnologyConceptType,
  TechnologyConcept,
  ConceptAlias,
  RelationTypeDefinition,
  TechnologyRelation,
  TechnologyPlatform,
  VendorGenerationTemplate,
  ServerFamily,
  ChassisVariant,
  PackAssignment,
  ServerModelComponentAssignment,
  CapabilityProfile,
  StorageTopology,
  StorageCageDefinition,
  BackplaneVariant,
  ServerStorageOption,
  ConfiguratorOptionGroup,
  CreationWizardSession,
  DraftDependencyNode,
  CreationManifest,
  PropertyAssignment,
  PropertyLinkRequirement,
  AdminAuditEvent,
  ImportBatch,
  ImportStagedRecord,
  ImportApplyAttempt,
  ReadyConfiguration,
  ReadyConfigurationVersion,
  QuoteRequest,
}) {
  async validateCatalogIndex() {
    const service = this as any
    const [definitions, assignments] = await Promise.all([
      service.listPropertyDefinitions({}, { take: 10000 }),
      service.listPropertyAssignments({}, { take: 100000 }),
    ])
    return validateCatalogPropertyIndex(definitions, assignments)
  }

  async getDomainCoverage() {
    const service = this as any
    const [
      properties,
      propertyValues,
      relationTypes,
      relations,
      concepts,
      aliases,
      packs,
      assignments,
    ] = await Promise.all([
      service.listPropertyDefinitions({}, { take: 10000 }),
      service.listPropertyValues({}, { take: 10000 }),
      service.listRelationTypeDefinitions({}, { take: 10000 }),
      service.listTechnologyRelations({}, { take: 10000 }),
      service.listTechnologyConcepts({}, { take: 10000 }),
      service.listConceptAliases({}, { take: 10000 }),
      service.listComponentPacks({}, { take: 10000 }),
      service.listPackAssignments({}, { take: 10000 }),
    ])

    return calculateDomainCoverage({
      properties,
      property_values: propertyValues,
      relation_types: relationTypes,
      relations,
      concepts,
      aliases,
      packs,
      assignments,
    })
  }

  async loadCompatibilityData(input: {
    server_model_slug?: string
    server_model_id?: string
    storage_option_id?: string
    selected_components?: SelectedComponentInput[]
    explicit_none?: string[]
    mode?: ValidationMode
    partial?: boolean
  }): Promise<CompatibilityData> {
    const service = this as any
    const [serverModel] = await service.listServerModels(
      input.server_model_id ? { id: input.server_model_id } : { slug: input.server_model_slug }
    )
    const [storageOptions, chassisVariants] = serverModel ? await Promise.all([
      service.listServerStorageOptions({ server_model_id: serverModel.id, enabled: true }, { take: 1000 }),
      service.listChassisVariants({ server_model_id: serverModel.id, enabled: true }, { take: 1000 }),
    ]) : [[], []]
    const chain = serverModel ? scopeChain(serverModel, chassisVariants, storageOptions, input.storage_option_id) : []
    const scopeIds = chain.map((scope) => scope.id)
    const scopedFilter = scopeIds.length ? scopeIds : ["__unresolved_scope__"]
    const [
      components,
      rules,
      componentTypeDefinitions,
      propertyDefinitions,
      propertyAssignments,
      propertyValues,
      relationTypeDefinitions,
      relations,
      capabilityProfiles,
      storageTopologies,
      optionGroups,
      packAssignments,
      packs,
      packItems,
      directAssignments,
      concepts,
      configurations,
    ] = await Promise.all([
      service.listComponents({ enabled: true }, { take: 10000 }),
      service.listCompatibilityRules({ enabled: true }, { take: 10000 }),
      service.listComponentTypeDefinitions({ enabled: true }, { take: 1000 }),
      service.listPropertyDefinitions({}, { take: 10000 }),
      service.listPropertyAssignments({ owner_id: scopedFilter, enabled: true }, { take: 10000 }),
      service.listPropertyValues({ owner_entity_id: scopedFilter }, { take: 10000 }),
      service.listRelationTypeDefinitions({}, { take: 10000 }),
      service.listTechnologyRelations({ enabled: true }, { take: 10000 }),
      service.listCapabilityProfiles({ owner_id: scopedFilter }, { take: 10000 }),
      service.listStorageTopologies({ owner_id: scopedFilter }, { take: 10000 }),
      service.listConfiguratorOptionGroups({ scope_id: scopedFilter, enabled: true }, { take: 10000 }),
      service.listPackAssignments({ scope_id: scopedFilter, enabled: true }, { take: 10000 }),
      service.listComponentPacks({ enabled: true }, { take: 10000 }),
      service.listComponentPackItems({ enabled: true }, { take: 10000 }),
      service.listServerModelComponentAssignments(serverModel ? { server_model_id: serverModel.id, enabled: true } : { server_model_id: "__unresolved_model__", enabled: true }, { take: 10000 }),
      service.listTechnologyConcepts({}, { take: 10000 }),
      service.listConfigurations(serverModel ? { server_model_id: serverModel.id } : { server_model_id: "__unresolved_model__" }, { take: 10000 }),
    ])
    const scopeSet = new Set(chain.map((scope) => `${scope.type}:${scope.id}`))
    const activePackIds = new Set(packAssignments.filter((assignment: any) => scopeSet.has(`${assignment.scope_type}:${assignment.scope_id}`) && assignment.inheritance_behavior !== "exclude").map((assignment: any) => assignment.component_pack_id))
    const bundles = packs.filter((pack: any) => pack.pack_kind === "assembly_bundle" && activePackIds.has(pack.id)).map((pack: any) => ({
      ...pack,
      components_json: packItems.filter((item: any) => item.component_pack_id === pack.id).map((item: any) => ({ component_id: item.component_id })),
    }))
    return {
      model: serverModel,
      components,
      selected: input.selected_components || [],
      rules,
      component_type_definitions: componentTypeDefinitions,
      property_definitions: propertyDefinitions,
      property_assignments: propertyAssignments,
      property_values: propertyValues,
      relation_type_definitions: relationTypeDefinitions,
      relations,
      concepts,
      configurations,
      capability_profiles: capabilityProfiles,
      storage_topologies: storageTopologies.filter((item: any) => chain.some((scope) => item.owner_type === scope.type && item.owner_id === scope.id)),
      storage_options: storageOptions.filter((item: any) => item.server_model_id === serverModel?.id),
      option_groups: optionGroups.filter((item: any) => scopeSet.has(`${item.scope_type}:${item.scope_id}`)),
      pack_assignments: packAssignments,
      packs,
      pack_items: packItems,
      direct_assignments: directAssignments,
      bundles,
      scope_chain: chain,
      explicit_none: input.explicit_none || [],
      mode: input.mode,
      partial: input.partial,
    }
  }

  async validateConfiguration(input: {
    server_model_slug?: string
    server_model_id?: string
    storage_option_id?: string
    selected_components: SelectedComponentInput[]
    explicit_none?: string[]
    mode?: ValidationMode
    partial?: boolean
  }) {
    return validateCompatibility(await this.loadCompatibilityData(input))
  }

  async getCompatibilityOptions(input: {
    server_model_slug?: string
    server_model_id?: string
    storage_option_id?: string
    selected_components?: SelectedComponentInput[]
    explicit_none?: string[]
  }) {
    const data = await this.loadCompatibilityData({ ...input, mode: "assisted_preview" })
    const result = buildOptionResponse(data)
    return {
      model: data.model,
      ...result,
      groups: buildStorefrontGroups(data, result.options),
      storage_choices: buildStorageChoices(data, result.options),
    }
  }

  async validateCompatibilityReadiness(input: {
    server_model_slug?: string
    server_model_id?: string
    storage_option_id?: string
    selected_components?: SelectedComponentInput[]
    explicit_none?: string[]
    mode?: ValidationMode
    partial?: boolean
    manifest?: any
  }) {
    const data = await this.loadCompatibilityData(input)
    return validateReadiness(data, { mode: input.mode, manifest: input.manifest })
  }
}

export default ServerConfiguratorModuleService
