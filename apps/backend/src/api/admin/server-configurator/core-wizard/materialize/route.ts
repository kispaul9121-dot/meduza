import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { materializeCoreServerWorkflow } from "../../../../../workflows/server-configurator/core-wizard/materialize-core-server";
import { CoreWizardMaterializeBody } from "../../validators";

export async function POST(
  req: MedusaRequest<CoreWizardMaterializeBody>,
  res: MedusaResponse,
) {
  const actor_id = (req as any).auth_context?.actor_id || "authenticated-admin";
  const { result } = await materializeCoreServerWorkflow(req.scope).run({
    input: { ...req.validatedBody, actor_id },
  });
  res.status(201).json(result);
}
