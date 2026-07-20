import { MedusaRequest } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";
import { GeniusRegistrySnapshot } from "../../../../../modules/server-configurator/genius-bootstrap";

export async function loadGeniusRegistry(
  req: MedusaRequest,
): Promise<GeniusRegistrySnapshot> {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const [
    platforms,
    generations,
    serverModels,
    concepts,
    aliases,
    packs,
    storageOptions,
    optionGroups,
    properties,
    relationTypes,
    relations,
    componentTypes,
  ] = await Promise.all([
    service.listTechnologyPlatforms({}, { take: 10000 }),
    service.listVendorGenerationTemplates({}, { take: 10000 }),
    service.listServerModels({}, { take: 10000 }),
    service.listTechnologyConcepts({}, { take: 10000 }),
    service.listConceptAliases({}, { take: 10000 }),
    service.listComponentPacks({}, { take: 10000 }),
    service.listServerStorageOptions({}, { take: 10000 }),
    service.listConfiguratorOptionGroups({}, { take: 10000 }),
    service.listPropertyDefinitions({}, { take: 10000 }),
    service.listRelationTypeDefinitions({}, { take: 10000 }),
    service.listTechnologyRelations({}, { take: 10000 }),
    service.listComponentTypeDefinitions({}, { take: 10000 }),
  ]);
  return {
    platforms,
    generations,
    server_models: serverModels,
    concepts,
    aliases,
    packs,
    storage_options: storageOptions,
    option_groups: optionGroups,
    properties,
    relation_types: relationTypes,
    relations,
    component_types: componentTypes,
  };
}
