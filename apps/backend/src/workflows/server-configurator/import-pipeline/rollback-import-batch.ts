import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";
import { rollbackImportWrites } from "./apply-import-batch";

type Input = { batch_id: string; actor_id: string; confirmation: "ROLLBACK_TECHNICAL_IMPORT" };

const rollbackStep = createStep(
  "rollback",
  async (input: Input, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const batch = await service.retrieveImportBatch(input.batch_id);
    if (batch.status !== "applied" || !batch.rollback_reference)
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only an applied batch with a rollback reference can be rolled back.");
    const attempt = await service.retrieveImportApplyAttempt(batch.rollback_reference);
    const restored = await rollbackImportWrites(service, attempt.rollback_json || []);
    const now = new Date();
    await service.updateImportApplyAttempts({ id: attempt.id, status: "rolled_back", rolled_back_at: now });
    await service.updateImportBatches({ id: batch.id, status: "rolled_back", rolled_back_at: now });
    await service.createAdminAuditEvents({
      actor_id: input.actor_id,
      action: "update",
      entity_type: "technical_import_batch",
      entity_id: batch.id,
      before_json: { status: "applied", attempt_id: attempt.id },
      after_json: { status: "rolled_back", restored },
      context_json: { operation: "rollback", publication: false },
    });
    return new StepResponse({ batch_id: batch.id, attempt_id: attempt.id, restored_count: restored.length, status: "rolled_back" });
  },
);

export const rollbackImportBatchWorkflow = createWorkflow(
  "rollback-import-batch",
  function (input: Input) {
    return new WorkflowResponse(rollbackStep(input));
  },
);
