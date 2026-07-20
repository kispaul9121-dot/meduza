import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const [
    coverage,
    properties,
    relationTypes,
    relations,
    concepts,
    packs,
    assignments,
  ] = await Promise.all([
    service.getDomainCoverage(),
    service.listPropertyDefinitions({}, { take: 10000 }),
    service.listRelationTypeDefinitions({}, { take: 10000 }),
    service.listTechnologyRelations({ enabled: true }, { take: 10000 }),
    service.listTechnologyConcepts(
      { lifecycle_status: "active" },
      { take: 10000 },
    ),
    service.listComponentPacks({}, { take: 10000 }),
    service.listPackAssignments({ enabled: true }, { take: 10000 }),
  ]);
  const relationTypeById = new Map<string, any>(
    relationTypes.map((item: any) => [item.id, item]),
  );
  const relationsWithoutInverse = relations.filter(
    (relation: any) =>
      !relationTypeById.get(relation.relation_type_id)?.inverse_relation_key,
  );
  const counts = {
    total_properties: properties.length,
    engine_mapped: properties.filter(
      (item: any) => item.usage_status === "engine_mapped",
    ).length,
    informational: properties.filter(
      (item: any) => item.usage_status === "informational",
    ).length,
    unused: coverage.properties_without_usage.length,
    unmapped: coverage.compatibility_properties_without_mapping.length,
    blocking:
      coverage.compatibility_properties_without_mapping.length +
      coverage.relation_types_without_validator.length +
      coverage.scopes_with_unresolved_inherited_conflicts.length,
    missing_validator: coverage.relation_types_without_validator.length,
    concepts_without_relations:
      coverage.concepts_without_consumers_or_providers.length,
    relations_without_inverse_provider_consumer: relationsWithoutInverse.length,
    inherited_conflicts:
      coverage.scopes_with_unresolved_inherited_conflicts.length,
    packs_without_effective_entities:
      coverage.packs_without_compatible_scope.length,
  };
  res.json({
    counts,
    coverage,
    relations_without_inverse: relationsWithoutInverse.map(
      (item: any) => item.id,
    ),
    entities: {
      properties,
      relation_types: relationTypes,
      concepts,
      packs,
      assignments,
    },
  });
}
