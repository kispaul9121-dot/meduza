import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MedusaError } from "@medusajs/framework/utils";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";
import {
  buildCapabilityProfileDraftPayload,
  buildServerModelDraftPayload,
  validateCoreServerDraft,
} from "../../../modules/server-configurator/core-server-wizard";

type Input = {
  session_id: string;
  draft: Record<string, any>;
  actor_id: string;
};
type Created = Array<{ method: string; id: string }>;

async function cleanup(service: any, created: Created) {
  for (const item of [...created].reverse()) {
    try {
      await service[item.method](item.id);
    } catch {
      /* compensation is idempotent */
    }
  }
}

const materializeStep = createStep(
  "materialize-core-server",
  async (input: Input, { container }) => {
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const coverage = validateCoreServerDraft(input.draft);
    if (!coverage.ready_for_materialization)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Core server draft is incomplete: ${coverage.blockers
          .filter((item) => item.step <= 12)
          .map((item) => item.field)
          .join(", ")}`,
      );
    const session = await service.retrieveCreationWizardSession(
      input.session_id,
    );
    if (session.owner_id !== input.actor_id)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This draft belongs to another administrator.",
      );
    if (input.draft.materialized_server_model_id)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This draft is already materialized. Continue editing the existing technical draft.",
      );
    const duplicates = await service.listServerModels({
      slug: input.draft.identity.slug,
    });
    if (duplicates.length)
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `Server slug ${input.draft.identity.slug} already exists.`,
      );
    const socketConcept = await service.retrieveTechnologyConcept(
      input.draft.cpu.socket_concept_id,
    );
    const created: Created = [];
    let previousSession = session;
    try {
      let model = await service.createServerModels(
        buildServerModelDraftPayload(input.draft, socketConcept),
      );
      created.push({ method: "deleteServerModels", id: model.id });
      const profile = await service.createCapabilityProfiles(
        buildCapabilityProfileDraftPayload(input.draft, model.id),
      );
      created.push({ method: "deleteCapabilityProfiles", id: profile.id });
      model = await service.updateServerModels({
        id: model.id,
        capability_profile_id: profile.id,
      });

      for (const [
        index,
        chassis,
      ] of input.draft.storage.chassis_variants.entries()) {
        const row = await service.createChassisVariants({
          key: `${input.draft.identity.slug}-${chassis.key || index + 1}`,
          server_model_id: model.id,
          name: chassis.name,
          properties_json: {
            ...chassis.properties,
            front_bays: chassis.front_bays,
            rear_bays: chassis.rear_bays,
            drive_form_factor: chassis.drive_form_factor,
            backplane_reference: chassis.backplane_reference,
          },
          source_json: { reference: input.draft.identity.source_document },
          schema_version: 1,
          enabled: false,
        });
        created.push({ method: "deleteChassisVariants", id: row.id });
      }

      for (const assignment of input.draft.properties.assignments || []) {
        const row = await service.createPropertyAssignments({
          owner_type: "server_model",
          owner_id: model.id,
          property_definition_id: assignment.property_definition_id,
          assignment_mode: assignment.mode,
          value_json: assignment.value ?? null,
          inherited_from_type: assignment.inherited_from_type || null,
          inherited_from_id: assignment.inherited_from_id || null,
          provenance_json: {
            source_reference: input.draft.identity.source_document,
            wizard: "core_server",
          },
          confidence: null,
          enabled: assignment.mode !== "disable",
        });
        created.push({ method: "deletePropertyAssignments", id: row.id });
      }

      const selectedPackIds = [
        ...new Set([
          ...(input.draft.cpu.suggested_pack_ids || []),
          ...(input.draft.memory.suggested_pack_ids || []),
          ...(input.draft.storage.suggested_drive_pack_ids || []),
          ...(input.draft.power.psu_pack_ids || []),
          ...(input.draft.power.fan_pack_ids || []),
          ...(input.draft.power.heatsink_pack_ids || []),
          ...(input.draft.network.nic_pack_ids || []),
          ...(input.draft.network.bundle_ids || []),
        ]),
      ];
      for (const component_pack_id of selectedPackIds) {
        const row = await service.createPackAssignments({
          scope_type: "server_model",
          scope_id: model.id,
          component_pack_id,
          enabled: false,
          priority: 100,
          inheritance_behavior: "inherit",
          exclusions_json: null,
          overrides_json: null,
          assignment_source: "core_server_wizard",
          source_reference: input.draft.identity.source_document,
        });
        created.push({ method: "deletePackAssignments", id: row.id });
      }

      for (const component_id of input.draft.network.direct_component_ids ||
        []) {
        const row = await service.createServerModelComponentAssignments({
          server_model_id: model.id,
          component_id,
          assignment_role: "optional_choice",
          selection_mode: "visible",
          default_quantity: 0,
          min_quantity: 0,
          max_quantity: 1,
          enabled: false,
          sort_order: 100,
          requirements_override_json: null,
          provides_override_json: null,
          consumes_override_json: null,
          conflicts_override_json: null,
          source_doc_reference: input.draft.identity.source_document,
          assignment_source: "core_server_wizard",
          notes: "Explicit direct component selected in core wizard",
        });
        created.push({
          method: "deleteServerModelComponentAssignments",
          id: row.id,
        });
      }

      for (const groupId of input.draft.optional_groups.option_group_ids ||
        []) {
        const original = await service.retrieveConfiguratorOptionGroup(groupId);
        if (
          original.scope_type === "server_model" &&
          original.scope_id !== model.id
        ) {
          const { id, created_at, updated_at, deleted_at, ...copy } = original;
          const row = await service.createConfiguratorOptionGroups({
            ...copy,
            key: `${input.draft.identity.slug}.${original.key}`,
            scope_id: model.id,
            enabled: false,
          });
          created.push({
            method: "deleteConfiguratorOptionGroups",
            id: row.id,
          });
        }
      }

      const nextDraft = {
        ...input.draft,
        materialized_server_model_id: model.id,
      };
      previousSession = session;
      await service.updateCreationWizardSessions({
        id: session.id,
        draft_payload_json: nextDraft,
        current_step: "13",
        status: "ready",
      });
      const audit = await service.createAdminAuditEvents({
        actor_id: input.actor_id,
        action: "apply",
        entity_type: "core_server_technical_draft",
        entity_id: model.id,
        before_json: null,
        after_json: {
          server_model: model,
          capability_profile_id: profile.id,
          created,
        },
        context_json: { wizard_session_id: session.id, publication: false },
      });
      created.push({ method: "deleteAdminAuditEvents", id: audit.id });
      return new StepResponse(
        {
          server_model: model,
          capability_profile: profile,
          draft: nextDraft,
          coverage,
          status: "technical_draft",
          writes: created.map(({ method, id }) => ({ method, id })),
        },
        { created, previousSession },
      );
    } catch (error) {
      await cleanup(service, created);
      await service.updateCreationWizardSessions(previousSession);
      throw error;
    }
  },
  async (undo, { container }) => {
    if (!undo) return;
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    await cleanup(service, undo.created);
    await service.updateCreationWizardSessions(undo.previousSession);
  },
);

export const materializeCoreServerWorkflow = createWorkflow(
  "materialize-core-server",
  function (input: Input) {
    return new WorkflowResponse(materializeStep(input));
  },
);
