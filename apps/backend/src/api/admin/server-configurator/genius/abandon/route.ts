import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { abandonGeniusSessionWorkflow } from "../../../../../workflows/server-configurator/genius/abandon-genius-session";
import { GeniusAbandonBody } from "../../validators";

export async function POST(
  req: MedusaRequest<GeniusAbandonBody>,
  res: MedusaResponse,
) {
  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin";
  const { result } = await abandonGeniusSessionWorkflow(req.scope).run({
    input: { session_id: req.validatedBody.session_id, actor_id: actorId },
  });
  res.json(result);
}
