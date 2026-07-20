import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { ImportBatchRollbackBody } from "../../../../validators";
import { rollbackImportBatchWorkflow } from "../../../../../../../workflows/server-configurator/import-pipeline/rollback-import-batch";
import { actorId, permissionFor } from "../../../_shared";

export async function POST(req: MedusaRequest<ImportBatchRollbackBody>, res: MedusaResponse) {
  const permission = await permissionFor(req);
  if (!permission.granted)
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Permission ${permission.required} is required for rollback.`);
  const { result } = await rollbackImportBatchWorkflow(req.scope).run({
    input: {
      batch_id: req.params.id,
      actor_id: actorId(req),
      confirmation: req.validatedBody.confirmation,
    },
  });
  res.json({ result, permission });
}
