import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { publishCoreServerWorkflow } from "../../../../../workflows/server-configurator/core-wizard/publish-core-server";
import { CoreWizardPublishBody } from "../../validators";

export async function POST(
  req: MedusaRequest<CoreWizardPublishBody>,
  res: MedusaResponse,
) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin";
  const { result } = await publishCoreServerWorkflow(req.scope).run({
    input: { ...req.validatedBody, actor_id },
  });
  res.status(201).json(result);
}
