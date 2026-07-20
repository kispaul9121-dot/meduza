import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  buildCreationManifest,
  buildDependencyPlan,
  discoverBootstrapContext,
} from "../../../../../modules/server-configurator/genius-bootstrap";
import { GeniusPlanBody } from "../../validators";
import { loadGeniusRegistry } from "../_shared/registry";

export async function POST(
  req: MedusaRequest<GeniusPlanBody>,
  res: MedusaResponse,
) {
  const registry = await loadGeniusRegistry(req);
  const plan = buildDependencyPlan(req.validatedBody.intent, registry);
  res.json({
    discovery: discoverBootstrapContext(req.validatedBody.intent, registry),
    plan,
    manifest: buildCreationManifest(req.validatedBody.intent, plan),
    writes_performed: false,
  });
}
