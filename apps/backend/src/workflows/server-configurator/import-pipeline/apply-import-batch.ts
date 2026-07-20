import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";
import {
  buildImportDryRun,
  buildTechnicalMutation,
  dependencyRank,
  IMPORT_ENTITY_DESCRIPTORS,
} from "../../../modules/server-configurator/import-apply";
import {
  CompensatedImportOperation,
  executeCompensatedImport,
} from "../../../modules/server-configurator/import-pipeline";

export type ApplyImportBatchInput = {
  batch_id: string;
  idempotency_key: string;
  actor_id: string;
  approved_groups: string[];
};

type RollbackEntry = {
  record_id: string;
  object_class: string;
  operation: "create" | "update" | "archive";
  entity_id: string;
  before: Record<string, any> | null;
};

function restorePayload(value: Record<string, any>) {
  const { created_at, updated_at, deleted_at, ...payload } = value;
  return payload;
}

export async function rollbackImportWrites(service: any, entries: RollbackEntry[]) {
  const restored: string[] = [];
  for (const entry of [...entries].reverse()) {
    const descriptor = IMPORT_ENTITY_DESCRIPTORS[entry.object_class];
    if (!descriptor) continue;
    if (entry.operation === "create") await service[descriptor.delete](entry.entity_id);
    else if (entry.before) await service[descriptor.update](restorePayload(entry.before));
    await service.updateImportStagedRecords({
      id: entry.record_id,
      apply_status: "rolled_back",
    });
    restored.push(entry.record_id);
  }
  return restored;
}

const applyImportBatchStep = createStep(
  "apply-import-batch",
  async (input: ApplyImportBatchInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const [existingAttempt] = await service.listImportApplyAttempts({
      idempotency_key: input.idempotency_key,
    });
    if (existingAttempt?.status === "applied")
      return new StepResponse(
        { ...existingAttempt.result_json, idempotent_replay: true },
        null,
      );

    const batch = await service.retrieveImportBatch(input.batch_id);
    const rows = await service.listImportStagedRecords(
      { batch_id: input.batch_id },
      { take: 10000, order: { sequence: "ASC" } },
    );
    if (batch.review_status !== "approved")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The import batch must be explicitly approved before apply.",
      );
    const dryRun = buildImportDryRun(rows, input.approved_groups);
    if (!dryRun.apply_available)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Import apply is blocked: ${dryRun.blockers.map((item) => item.message).join("; ") || "no approved rows"}`,
      );

    const attempt = existingAttempt || await service.createImportApplyAttempts({
      batch_id: batch.id,
      idempotency_key: input.idempotency_key,
      actor_id: input.actor_id,
      status: "started",
      approved_groups_json: input.approved_groups,
      result_json: null,
      rollback_json: null,
      error_json: null,
      applied_at: null,
      rolled_back_at: null,
    });
    await service.updateImportBatches({ id: batch.id, status: "applying" });

    const selected = rows
      .filter((row: any) => {
        const group = row.classification_confirmed || row.object_class;
        return row.review_status === "approved" &&
          (!input.approved_groups.length || input.approved_groups.includes(group));
      })
      .sort((left: any, right: any) => dependencyRank(left) - dependencyRank(right));
    const rollback: RollbackEntry[] = [];
    const operations: CompensatedImportOperation<any>[] = [];

    for (const row of selected) {
      if (["unchanged", "block"].includes(row.action)) continue;
      const mutation = buildTechnicalMutation(row);
      operations.push({
        key: row.id,
        apply: async () => {
          let before: Record<string, any> | null = null;
          let entity: any;
          if (row.action === "create") {
            entity = await service[mutation.descriptor.create](mutation.payload);
          } else {
            const retrieved = await service[mutation.descriptor.retrieve](row.existing_entity_id);
            before = retrieved;
            if (row.action === "update")
              entity = await service[mutation.descriptor.update]({ id: retrieved.id, ...mutation.payload });
            else {
              const archivePatch = "enabled" in retrieved
                ? { enabled: false }
                : "lifecycle_status" in retrieved
                  ? { lifecycle_status: "deprecated" }
                  : "review_status" in retrieved
                    ? { review_status: "deprecated" }
                    : null;
              if (!archivePatch)
                throw new MedusaError(MedusaError.Types.INVALID_DATA, `${mutation.object_class} does not expose a recoverable archive field.`);
              entity = await service[mutation.descriptor.update]({ id: retrieved.id, ...archivePatch });
            }
          }
          const entry: RollbackEntry = {
            record_id: row.id,
            object_class: mutation.object_class,
            operation: row.action,
            entity_id: entity.id,
            before,
          };
          rollback.push(entry);
          await service.updateImportStagedRecords({
            id: row.id,
            apply_status: "applied",
            applied_entity_type: mutation.object_class,
            applied_entity_id: entity.id,
            before_json: before,
            after_json: entity,
          });
          return entry;
        },
        compensate: async (entry) => {
          await rollbackImportWrites(service, [entry]);
          const index = rollback.findIndex((item) => item.record_id === entry.record_id);
          if (index >= 0) rollback.splice(index, 1);
        },
      });
    }

    try {
      await executeCompensatedImport(operations);
      for (const row of selected.filter((item: any) => item.action === "unchanged"))
        await service.updateImportStagedRecords({ id: row.id, apply_status: "skipped" });
      const affectedServerModelIds = [
        ...new Set<string>(
          selected
            .map((row: any) =>
              row.normalized_payload_json?.server_model_id ||
              row.normalized_payload_json?.knowledge?.payload?.server_model_id,
            )
            .filter(Boolean),
        ),
      ];
      const readiness: Array<{ server_model_id: string; result: any }> = [];
      for (const serverModelId of affectedServerModelIds) {
        readiness.push({
          server_model_id: serverModelId,
          result: await service.validateCompatibilityReadiness({
            server_model_id: serverModelId,
            selected_components: [],
            explicit_none: [],
            mode: "assisted_preview",
            partial: true,
          }),
        });
      }
      const result = {
        batch_id: batch.id,
        attempt_id: attempt.id,
        idempotency_key: input.idempotency_key,
        applied_count: rollback.length,
        unchanged_count: selected.filter((row: any) => row.action === "unchanged").length,
        writes: rollback,
        publication_actions: [],
        post_validation: {
          executed: true,
          affected_server_model_ids: affectedServerModelIds,
          readiness,
        },
      };
      const now = new Date();
      await service.updateImportApplyAttempts({ id: attempt.id, status: "applied", result_json: result, rollback_json: rollback, applied_at: now });
      await service.updateImportBatches({ id: batch.id, status: "applied", dry_run: false, applied_at: now, rollback_reference: attempt.id });
      await service.createAdminAuditEvents({
        actor_id: input.actor_id,
        action: "apply",
        entity_type: "technical_import_batch",
        entity_id: batch.id,
        before_json: { status: batch.status },
        after_json: result,
        context_json: { idempotency_key: input.idempotency_key, publication: false },
      });
      return new StepResponse(result, { batch_id: batch.id, attempt_id: attempt.id, rollback });
    } catch (error) {
      await service.updateImportApplyAttempts({ id: attempt.id, status: "failed", error_json: { message: error instanceof Error ? error.message : String(error) }, rollback_json: rollback });
      await service.updateImportBatches({ id: batch.id, status: "failed", errors_json: [{ code: "APPLY_FAILED", message: error instanceof Error ? error.message : String(error) }] });
      throw error;
    }
  },
  async (undo, { container }) => {
    if (!undo) return;
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    await rollbackImportWrites(service, undo.rollback || []);
    await service.updateImportApplyAttempts({ id: undo.attempt_id, status: "rolled_back", rolled_back_at: new Date() });
    await service.updateImportBatches({ id: undo.batch_id, status: "rolled_back", rolled_back_at: new Date() });
  },
);

export const applyImportBatchWorkflow = createWorkflow(
  "apply-import-batch",
  function (input: ApplyImportBatchInput) {
    return new WorkflowResponse(applyImportBatchStep(input));
  },
);
