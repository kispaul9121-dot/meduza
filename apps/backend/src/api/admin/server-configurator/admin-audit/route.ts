import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const [
    [events, count],
    propertyDefinitions,
    concepts,
    relations,
    platforms,
    generations,
    assignments,
    optionGroups,
    typeDefinitions,
  ] = await Promise.all([
    service.listAndCountAdminAuditEvents(
      {},
      {
        take: limit,
        skip: Number(req.query.offset || 0),
        order: { created_at: "DESC" },
      },
    ),
    service.listAndCountPropertyDefinitions({}, { take: 1 }),
    service.listAndCountTechnologyConcepts({}, { take: 1 }),
    service.listAndCountTechnologyRelations({}, { take: 1 }),
    service.listAndCountTechnologyPlatforms({}, { take: 1 }),
    service.listAndCountVendorGenerationTemplates({}, { take: 1 }),
    service.listAndCountServerModelComponentAssignments({}, { take: 1 }),
    service.listAndCountConfiguratorOptionGroups({}, { take: 1 }),
    service.listAndCountComponentTypeDefinitions({}, { take: 1 }),
  ]);
  res.json({
    events,
    count,
    usage: {
      property_definitions: propertyDefinitions[1],
      technology_concepts: concepts[1],
      mapped_relationships: relations[1],
      technology_platforms: platforms[1],
      vendor_generations: generations[1],
      direct_assignments: assignments[1],
      option_groups: optionGroups[1],
      component_type_contracts: typeDefinitions[1],
    },
  });
}
