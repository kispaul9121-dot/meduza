import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";

type SaveGeniusManifestInput = {
  id?: string;
  session_id: string;
  actor_id: string;
  manifest: Record<string, any>;
  nodes: any[];
};

const saveManifestGraphStep = createStep(
  "save-manifest-graph",
  async (input: SaveGeniusManifestInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const session = await service.retrieveCreationWizardSession(
      input.session_id,
    );
    if (session.owner_id !== input.actor_id)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The Genius session belongs to another administrator.",
      );
    if (
      (input.manifest.blockers || []).some(
        (item: any) => item.state === "duplicate",
      )
    )
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "Duplicate canonical identities must be resolved before saving a confirmed manifest.",
      );

    const existingNodes = await service.listDraftDependencyNodes(
      { wizard_session_id: input.session_id },
      { take: 10000 },
    );
    const existingManifests = await service.listCreationManifests(
      { wizard_session_id: input.session_id },
      { take: 100, order: { updated_at: "DESC" } },
    );
    const target = input.id
      ? await service.retrieveCreationManifest(input.id)
      : existingManifests[0] || null;
    if (target && target.wizard_session_id !== input.session_id)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The manifest does not belong to this Genius session.",
      );

    const beforeManifest = target ? { ...target } : null;
    const createdNodeIds: string[] = [];
    let saved: any = null;
    try {
      if (existingNodes.length)
        await service.deleteDraftDependencyNodes(
          existingNodes.map((row: any) => row.id),
        );
      for (const node of input.nodes) {
        const created = await service.createDraftDependencyNodes({
          wizard_session_id: input.session_id,
          node_type: node.node_type,
          requested_identity_json: {
            key: node.id,
            label: node.label,
            action: node.action,
            decision: node.decision,
            existing_ids: node.existing_ids,
          },
          parent_node_id: null,
          resolution_status:
            node.state === "exists"
              ? "resolved"
              : node.blocker
                ? "blocked"
                : "unresolved",
          resolved_entity_id: node.existing_ids?.[0] || null,
          error_json: node.blocker ? { message: node.blocker } : null,
          provenance_json: {
            source_reference: node.source,
            confidence: node.confidence,
          },
        });
        createdNodeIds.push(created.id);
      }
      const payload = {
        wizard_session_id: input.session_id,
        planned_creates_json: input.manifest.planned_creates || [],
        planned_updates_json: input.manifest.planned_updates || [],
        planned_links_json: input.manifest.planned_links || [],
        planned_assignments_json: input.manifest.planned_assignments || [],
        warnings_json: input.manifest.warnings || [],
        blockers_json: input.manifest.blockers || [],
        publication_actions_json:
          input.manifest.publication_actions || [],
        manifest_version: Number(target?.manifest_version || 0) + 1,
        status: "confirmed",
      };
      saved = target
        ? await service.updateCreationManifests({ id: target.id, ...payload })
        : await service.createCreationManifests(payload);
      return new StepResponse(
        { manifest: saved, dependency_nodes: createdNodeIds.length },
        {
          created_manifest_id: target ? null : saved.id,
          before_manifest: beforeManifest,
          created_node_ids: createdNodeIds,
          previous_nodes: existingNodes,
        },
      );
    } catch (error) {
      if (createdNodeIds.length)
        await service.deleteDraftDependencyNodes(createdNodeIds);
      for (const node of existingNodes)
        await service.createDraftDependencyNodes(node);
      if (saved && !target) await service.deleteCreationManifests(saved.id);
      if (target && beforeManifest)
        await service.updateCreationManifests(beforeManifest);
      throw error;
    }
  },
  async (undo, { container }) => {
    if (!undo) return;
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    if (undo.created_node_ids?.length)
      await service.deleteDraftDependencyNodes(undo.created_node_ids);
    for (const node of undo.previous_nodes || [])
      await service.createDraftDependencyNodes(node);
    if (undo.created_manifest_id)
      await service.deleteCreationManifests(undo.created_manifest_id);
    if (undo.before_manifest)
      await service.updateCreationManifests(undo.before_manifest);
  },
);

const auditGeniusManifestStep = createStep(
  "audit-genius-manifest",
  async (
    input: { actor_id: string; session_id: string; result: any },
    { container },
  ) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const event = await service.createAdminAuditEvents({
      actor_id: input.actor_id,
      action: "approve",
      entity_type: "creation_manifest",
      entity_id: input.result.manifest.id,
      before_json: null,
      after_json: {
        manifest_version: input.result.manifest.manifest_version,
        status: input.result.manifest.status,
      },
      context_json: {
        wizard_session_id: input.session_id,
        explicit_confirmation: "SAVE_CONFIRMED_MANIFEST",
      },
    });
    return new StepResponse(event.id, event.id);
  },
  async (id, { container }) => {
    if (id)
      await (
        container.resolve(SERVER_CONFIGURATOR_MODULE) as any
      ).deleteAdminAuditEvents(id);
  },
);

export const saveGeniusManifestWorkflow = createWorkflow(
  "save-genius-manifest",
  function (input: SaveGeniusManifestInput) {
    const result = saveManifestGraphStep(input);
    auditGeniusManifestStep({
      actor_id: input.actor_id,
      session_id: input.session_id,
      result,
    });
    return new WorkflowResponse(result);
  },
);
