import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { discoverBootstrapContext } from "../../../../../modules/server-configurator/genius-bootstrap";
import { GeniusPlanBody } from "../../validators";
import { loadGeniusRegistry } from "../_shared/registry";

export async function POST(
  req: MedusaRequest<GeniusPlanBody>,
  res: MedusaResponse,
) {
  const registry = await loadGeniusRegistry(req);
  res.json(discoverBootstrapContext(req.validatedBody.intent, registry));
}
