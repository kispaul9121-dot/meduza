import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  buildCreationManifest,
  buildDependencyPlan,
} from "../../../../../modules/server-configurator/genius-bootstrap";
import { saveGeniusManifestWorkflow } from "../../../../../workflows/server-configurator/genius/save-genius-manifest";
import { GeniusManifestSaveBody } from "../../validators";
import { loadGeniusRegistry } from "../_shared/registry";

export async function POST(
  req: MedusaRequest<GeniusManifestSaveBody>,
  res: MedusaResponse,
) {
  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin";
  const registry = await loadGeniusRegistry(req);
  const plan = buildDependencyPlan(req.validatedBody.intent, registry);
  const manifest = buildCreationManifest(req.validatedBody.intent, plan);
  const { result } = await saveGeniusManifestWorkflow(req.scope).run({
    input: {
      id: req.validatedBody.id,
      session_id: req.validatedBody.session_id,
      actor_id: actorId,
      manifest,
      nodes: plan.nodes,
    },
  });
  res.json({
    ...result,
    preview: manifest,
    production_entities_touched: 0,
  });
}
