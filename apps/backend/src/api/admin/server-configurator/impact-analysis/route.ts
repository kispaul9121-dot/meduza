import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator";
import { ImpactAnalysisBody } from "../validators";

export async function POST(
  req: MedusaRequest<ImpactAnalysisBody>,
  res: MedusaResponse,
) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const { entity_type, entity_id } = req.validatedBody;
  let modelIds = new Set<string>();
  let componentIds = new Set<string>();
  let evidence: any[] = [];
  if (entity_type === "property_definition") {
    const [assignments, values] = await Promise.all([
      service.listPropertyAssignments(
        { property_definition_id: entity_id, enabled: true },
        { take: 10000 },
      ),
      service.listPropertyValues(
        { property_definition_id: entity_id },
        { take: 10000 },
      ),
    ]);
    evidence = [...assignments, ...values];
    for (const item of evidence) {
      const ownerType = item.owner_type || item.owner_entity_type;
      const ownerId = item.owner_id || item.owner_entity_id;
      if (ownerType === "server_model") modelIds.add(ownerId);
      if (ownerType === "component") componentIds.add(ownerId);
    }
  }
  if (entity_type === "technology_concept") {
    evidence = await service.listTechnologyRelations(
      {
        $or: [{ source_id: entity_id }, { target_id: entity_id }],
        enabled: true,
      },
      { take: 10000 },
    );
    evidence.forEach((item: any) => {
      if (item.source_type === "server_model") modelIds.add(item.source_id);
      if (item.target_type === "server_model") modelIds.add(item.target_id);
      if (item.source_type === "component") componentIds.add(item.source_id);
      if (item.target_type === "component") componentIds.add(item.target_id);
    });
  }
  if (entity_type === "technology_relation") {
    const relation = await service.retrieveTechnologyRelation(entity_id);
    evidence = [relation];
    if (relation.source_type === "server_model")
      modelIds.add(relation.source_id);
    if (relation.target_type === "server_model")
      modelIds.add(relation.target_id);
    if (relation.source_type === "component")
      componentIds.add(relation.source_id);
    if (relation.target_type === "component")
      componentIds.add(relation.target_id);
  }
  if (entity_type === "pack_assignment") {
    const assignment = await service.retrievePackAssignment(entity_id);
    const items = await service.listComponentPackItems(
      { component_pack_id: assignment.component_pack_id, enabled: true },
      { take: 10000 },
    );
    items.forEach((item: any) => componentIds.add(item.component_id));
    if (assignment.scope_type === "server_model")
      modelIds.add(assignment.scope_id);
    else {
      const fieldByScope: Record<string, string> = {
        technology_platform: "technology_platform_id",
        vendor_generation: "vendor_generation_template_id",
        server_family: "server_family_id",
      };
      const field = fieldByScope[assignment.scope_type];
      if (field)
        (
          await service.listServerModels(
            { [field]: assignment.scope_id },
            { take: 10000 },
          )
        ).forEach((model: any) => modelIds.add(model.id));
    }
    evidence = [assignment, ...items];
  }
  const configurations = modelIds.size
    ? await service.listConfigurations(
        { server_model_id: [...modelIds] },
        { take: 10000 },
      )
    : [];
  const activeConfigurations = configurations.filter((item: any) =>
    ["draft", "valid"].includes(item.status),
  );
  res.json({
    entity_type,
    entity_id,
    affected_server_models: [...modelIds],
    affected_components: [...componentIds],
    affected_ready_configurations: configurations
      .filter((item: any) => item.status === "valid")
      .map((item: any) => item.id),
    potentially_invalid_carts_or_configurations: activeConfigurations.map(
      (item: any) => ({
        configuration_id: item.id,
        cart_id: item.medusa_cart_id,
      }),
    ),
    revalidation_required: modelIds.size > 0 || componentIds.size > 0,
    evidence_count: evidence.length,
    writes_performed: false,
  });
}
