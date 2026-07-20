import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";
import { validateCoreServerDraft } from "../../../../../modules/server-configurator/core-server-wizard";
import { CoreWizardPreviewBody } from "../../validators";

export async function POST(
  req: MedusaRequest<CoreWizardPreviewBody>,
  res: MedusaResponse,
) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const draft = req.validatedBody.draft;
  const [platform, generation, packAssignments] = await Promise.all([
    draft.platform.technology_platform_id
      ? service
          .retrieveTechnologyPlatform(draft.platform.technology_platform_id)
          .catch(() => null)
      : null,
    draft.platform.vendor_generation_template_id
      ? service
          .retrieveVendorGenerationTemplate(
            draft.platform.vendor_generation_template_id,
          )
          .catch(() => null)
      : null,
    service.listPackAssignments({ enabled: true }, { take: 10000 }),
  ]);
  const inheritedScopeIds = [
    draft.platform.technology_platform_id,
    draft.platform.vendor_generation_template_id,
    draft.platform.server_family_id,
  ].filter(Boolean);
  const inheritedPacks = packAssignments.filter(
    (assignment: any) =>
      inheritedScopeIds.includes(assignment.scope_id) &&
      assignment.inheritance_behavior !== "exclude",
  );
  let simulation: any = null;
  if (draft.materialized_server_model_id) {
    const storageIds = draft.simulation.storage_option_ids?.length
      ? draft.simulation.storage_option_ids
      : [undefined];
    simulation = await Promise.all(
      storageIds.map((storage_option_id: string | undefined) =>
        service.validateCompatibilityReadiness({
          server_model_id: draft.materialized_server_model_id,
          storage_option_id,
          selected_components: draft.simulation.representative_components,
          explicit_none: draft.simulation.explicit_none,
          mode: "assisted_preview",
          partial: true,
        }),
      ),
    );
  }
  res.json({
    coverage: validateCoreServerDraft(draft),
    inheritance: {
      platform_properties: platform?.properties_json || {},
      generation_properties: generation?.inherited_properties_json || {},
      inherited_pack_assignments: inheritedPacks,
      exclusions: draft.platform.exclusions || [],
      overrides: draft.platform.overrides || {},
    },
    simulation,
    materialization_required: !draft.materialized_server_model_id,
    writes_performed: false,
  });
}
