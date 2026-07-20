import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Stage08ReviewedImportAdapter } from "../../../../../modules/server-configurator/genius-apply-adapter";
import { GeniusBulkAdapterBody } from "../../validators";

export async function POST(
  req: MedusaRequest<GeniusBulkAdapterBody>,
  res: MedusaResponse,
) {
  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin";
  const body = req.validatedBody;
  const adapter = new Stage08ReviewedImportAdapter();
  const input = {
    manifest: body.manifest,
    idempotency_key: body.idempotency_key,
    actor_id: actorId,
    approved_groups: body.approved_groups,
  };
  if (body.operation === "apply") await adapter.apply(input);
  res.json({
    capabilities: adapter.capabilities(),
    result: await adapter.dryRun(input),
    permission: {
      required: "server-configurator-bulk-apply",
      apply_granted: false,
      review_endpoint: "/admin/server-configurator/import-pipeline/genius-manifest",
    },
  });
}
