import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const [
    platforms,
    generations,
    families,
    conceptTypes,
    concepts,
    properties,
    packs,
    packAssignments,
    components,
    optionGroups,
    models,
  ] = await Promise.all([
    service.listTechnologyPlatforms(
      { enabled: true },
      { take: 1000, order: { name: "ASC" } },
    ),
    service.listVendorGenerationTemplates(
      { enabled: true },
      { take: 1000, order: { vendor: "ASC", generation_label: "ASC" } },
    ),
    service.listServerFamilies(
      { enabled: true },
      { take: 1000, order: { name: "ASC" } },
    ),
    service.listTechnologyConceptTypes(
      { enabled: true },
      { take: 1000, order: { name: "ASC" } },
    ),
    service.listTechnologyConcepts(
      { lifecycle_status: "active" },
      { take: 5000, order: { display_name: "ASC" } },
    ),
    service.listPropertyDefinitions(
      { lifecycle_status: ["active", "draft"] },
      { take: 5000, order: { key: "ASC" } },
    ),
    service.listComponentPacks(
      { enabled: true },
      { take: 5000, order: { name: "ASC" } },
    ),
    service.listPackAssignments({ enabled: true }, { take: 10000 }),
    service.listComponents(
      { enabled: true },
      { take: 10000, order: { type: "ASC", public_name: "ASC" } },
    ),
    service.listConfiguratorOptionGroups(
      { enabled: true },
      { take: 5000, order: { sort_order: "ASC" } },
    ),
    service.listServerModels({}, { take: 1000, order: { public_name: "ASC" } }),
  ]);
  res.json({
    platforms,
    generations,
    families,
    concept_types: conceptTypes,
    concepts,
    properties,
    packs,
    pack_assignments: packAssignments,
    components,
    option_groups: optionGroups,
    models,
  });
}
