import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";

type AbandonInput = { session_id: string; actor_id: string };

const abandonSessionStep = createStep(
  "abandon-session",
  async (input: AbandonInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const session = await service.retrieveCreationWizardSession(
      input.session_id,
    );
    if (session.owner_id !== input.actor_id)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The Genius session belongs to another administrator.",
      );
    const manifests = await service.listCreationManifests(
      { wizard_session_id: input.session_id },
      { take: 1000 },
    );
    const beforeManifests = manifests.map((row: any) => ({ ...row }));
    await service.updateCreationWizardSessions({
      id: session.id,
      status: "abandoned",
    });
    for (const manifest of manifests)
      await service.updateCreationManifests({
        id: manifest.id,
        status: "superseded",
      });
    return new StepResponse(
      {
        session_id: session.id,
        status: "abandoned",
        existing_entities_modified: 0,
        existing_entities_deleted: 0,
        retained_audit_records: true,
        superseded_manifests: manifests.length,
      },
      { session, manifests: beforeManifests },
    );
  },
  async (undo, { container }) => {
    if (!undo) return;
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    await service.updateCreationWizardSessions(undo.session);
    for (const manifest of undo.manifests || [])
      await service.updateCreationManifests(manifest);
  },
);

const auditAbandonStep = createStep(
  "audit-abandon",
  async (input: AbandonInput, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const event = await service.createAdminAuditEvents({
      actor_id: input.actor_id,
      action: "update",
      entity_type: "creation_wizard_session",
      entity_id: input.session_id,
      before_json: { status: "draft" },
      after_json: { status: "abandoned" },
      context_json: {
        explicit_confirmation: "ABANDON_GENIUS_DRAFT",
        production_entities_touched: 0,
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

export const abandonGeniusSessionWorkflow = createWorkflow(
  "abandon-genius-session",
  function (input: AbandonInput) {
    const result = abandonSessionStep(input);
    auditAbandonStep(input);
    return new WorkflowResponse(result);
  },
);
