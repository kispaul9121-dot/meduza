import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { SERVER_CONFIGURATOR_MODULE } from "../../../modules/server-configurator";

type Input = {
  session_id: string;
  server_model_id: string;
  draft: Record<string, any>;
  actor_id: string;
  confirmation: string;
};

async function removeProducts(container: any, ids: string[]) {
  if (!ids.length) return;
  try {
    await deleteProductsWorkflow(container).run({ input: { ids } });
  } catch {
    /* idempotent workflow compensation */
  }
}

function productInputs(draft: Record<string, any>, shippingProfileId: string) {
  const chassis = draft.storage.chassis_variants;
  const base = {
    description: undefined,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfileId,
    metadata: {
      server_configurator: true,
      technical_source: "core_server_wizard",
      source_doc_reference: draft.identity.source_document,
      product_strategy: draft.product_strategy,
    },
  };
  const oneProduct = [
    "single_card_chassis_options",
    "shared_technical_platform",
  ].includes(draft.product_strategy);
  if (oneProduct)
    return [
      {
        ...base,
        title: draft.identity.public_name,
        handle: draft.identity.slug,
        options: [
          { title: "Chassis", values: chassis.map((item: any) => item.name) },
        ],
        variants: chassis.map((item: any, index: number) => ({
          title: item.name,
          sku: `${draft.identity.slug}-${item.key || index + 1}`
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_"),
          options: { Chassis: item.name },
          manage_inventory: false,
        })),
      },
    ];
  return chassis.map((item: any, index: number) => ({
    ...base,
    title: `${draft.identity.public_name} ${item.name}`,
    handle: `${draft.identity.slug}-${item.key || index + 1}`,
    options: [{ title: "Chassis", values: [item.name] }],
    variants: [
      {
        title: item.name,
        sku: `${draft.identity.slug}-${item.key || index + 1}`
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_"),
        options: { Chassis: item.name },
        manage_inventory: false,
      },
    ],
  }));
}

const publishStep = createStep(
  "publish-core-server",
  async (input: Input, { container }) => {
    if (input.confirmation !== "PUBLISH_VALIDATED_SERVER")
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Explicit publication confirmation is required.",
      );
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    const [model, session, profiles] = await Promise.all([
      service.retrieveServerModel(input.server_model_id),
      service.retrieveCreationWizardSession(input.session_id),
      service.listCapabilityProfiles({
        owner_type: "server_model",
        owner_id: input.server_model_id,
      }),
    ]);
    if (session.owner_id !== input.actor_id)
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This draft belongs to another administrator.",
      );
    if (model.enabled)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Server is already published.",
      );
    const readiness = await service.validateCompatibilityReadiness({
      server_model_id: model.id,
      selected_components: input.draft.simulation.representative_components,
      explicit_none: input.draft.simulation.explicit_none,
      mode: "production_validation",
      partial: false,
    });
    if (!readiness.ready)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Compatibility readiness blocks publication: ${(readiness.blockers || []).map((item: any) => item.code).join(", ")}`,
      );
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      pagination: { take: 1 },
    });
    if (!shippingProfiles[0]?.id)
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A Medusa shipping profile is required before product creation.",
      );
    const productIds: string[] = [];
    const previousModel = model;
    const previousProfile = profiles[0] || null;
    const previousSession = session;
    let audit: any;
    try {
      const { result: products } = await createProductsWorkflow(container).run({
        input: { products: productInputs(input.draft, shippingProfiles[0].id) },
      });
      productIds.push(...products.map((item: any) => item.id));
      const primary = products[0] as any;
      const updatedModel = await service.updateServerModels({
        id: model.id,
        medusa_product_id: primary.id,
        medusa_variant_id: primary.variants?.[0]?.id || null,
        enabled: true,
      });
      if (previousProfile)
        await service.updateCapabilityProfiles({
          id: previousProfile.id,
          review_status: "verified",
        });
      await service.updateCreationWizardSessions({
        id: session.id,
        status: "completed",
        current_step: "14",
        draft_payload_json: {
          ...input.draft,
          materialized_server_model_id: model.id,
          published_product_ids: productIds,
        },
      });
      audit = await service.createAdminAuditEvents({
        actor_id: input.actor_id,
        action: "approve",
        entity_type: "core_server_publication",
        entity_id: model.id,
        before_json: {
          server_model: previousModel,
          capability_profile: previousProfile,
        },
        after_json: {
          server_model: updatedModel,
          product_ids: productIds,
          readiness_status: readiness.status,
        },
        context_json: {
          wizard_session_id: session.id,
          reviewer: input.draft.review.reviewer,
          confirmation: input.confirmation,
        },
      });
      return new StepResponse(
        {
          server_model: updatedModel,
          products,
          readiness,
          status: "published",
          storefront_path: `/servers/${updatedModel.slug}`,
        },
        {
          productIds,
          previousModel,
          previousProfile,
          previousSession,
          auditId: audit.id,
        },
      );
    } catch (error) {
      if (audit?.id)
        try {
          await service.deleteAdminAuditEvents(audit.id);
        } catch {
          /* idempotent */
        }
      await service.updateServerModels(previousModel);
      if (previousProfile)
        await service.updateCapabilityProfiles(previousProfile);
      await service.updateCreationWizardSessions(previousSession);
      await removeProducts(container, productIds);
      throw error;
    }
  },
  async (undo, { container }) => {
    if (!undo) return;
    const service = container.resolve(SERVER_CONFIGURATOR_MODULE) as any;
    if (undo.auditId)
      try {
        await service.deleteAdminAuditEvents(undo.auditId);
      } catch {
        /* idempotent */
      }
    await service.updateServerModels(undo.previousModel);
    if (undo.previousProfile)
      await service.updateCapabilityProfiles(undo.previousProfile);
    await service.updateCreationWizardSessions(undo.previousSession);
    await removeProducts(container, undo.productIds);
  },
);

export const publishCoreServerWorkflow = createWorkflow(
  "publish-core-server",
  function (input: Input) {
    return new WorkflowResponse(publishStep(input));
  },
);
