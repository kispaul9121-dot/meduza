import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { ImportBatchApplyBody } from "../../../../validators";
import { applyImportBatchWorkflow } from "../../../../../../../workflows/server-configurator/import-pipeline/apply-import-batch";
import { actorId, permissionFor } from "../../../_shared";

export async function POST(req: MedusaRequest<ImportBatchApplyBody>, res: MedusaResponse) {
  const permission = await permissionFor(req);
  if (!permission.granted)
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Permission ${permission.required} is required for transactional apply.`);
  const { result } = await applyImportBatchWorkflow(req.scope).run({
    input: {
      batch_id: req.params.id,
      idempotency_key: req.validatedBody.idempotency_key,
      actor_id: actorId(req),
      approved_groups: req.validatedBody.approved_groups,
    },
  });
  res.json({ result, permission });
}
