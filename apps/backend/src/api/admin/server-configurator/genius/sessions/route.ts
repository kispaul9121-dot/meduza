import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../modules/server-configurator";
import { GENIUS_MODES } from "../../../../../modules/server-configurator/genius-bootstrap";
import { mutateKnowledgeEntityWorkflow } from "../../../../../workflows/server-configurator/knowledge-base/mutate-entity";
import { GeniusSessionBody } from "../../validators";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin";
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any;
  const [sessions, count] = await service.listAndCountCreationWizardSessions(
    {
      owner_id: actorId,
      mode_hint: [...GENIUS_MODES],
      status: ["draft", "ready", "failed"],
    },
    { take: 100, order: { updated_at: "DESC" } },
  );
  const manifests = sessions.length
    ? await service.listCreationManifests(
        { wizard_session_id: sessions.map((row: any) => row.id) },
        { take: 10000, order: { updated_at: "DESC" } },
      )
    : [];
  res.json({
    sessions: sessions.map((session: any) => ({
      ...session,
      latest_manifest:
        manifests.find(
          (manifest: any) => manifest.wizard_session_id === session.id,
        ) || null,
    })),
    count,
  });
}

export async function POST(
  req: MedusaRequest<GeniusSessionBody>,
  res: MedusaResponse,
) {
  const actorId = (req as any).auth_context?.actor_id || "authenticated-admin";
  const body = req.validatedBody;
  const { result } = await mutateKnowledgeEntityWorkflow(req.scope).run({
    input: {
      operation: body.id ? "update" : "create",
      entity_type: "creation_wizard_session",
      id: body.id,
      actor_id: actorId,
      data: {
        owner_id: actorId,
        current_step: String(body.current_phase),
        draft_payload_json: {
          schema_version: 1,
          intent: body.intent,
          state: body.state,
        },
        mode_hint: body.intent.mode,
        status: body.status,
        schema_version: 1,
      },
      context: {
        autosave: true,
        wizard: "genius_bootstrap",
        production_entities_touched: 0,
      },
    },
  });
  res.status(body.id ? 200 : 201).json(result);
}
