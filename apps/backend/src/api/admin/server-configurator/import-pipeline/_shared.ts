import { MedusaRequest } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { BULK_APPLY_PERMISSION, hasBulkApplyPermission } from "../../../../modules/server-configurator/import-apply";

export function actorId(req: MedusaRequest) {
  return (req as any).auth_context?.actor_id || "authenticated-admin";
}

export async function permissionFor(req: MedusaRequest) {
  const actor = actorId(req);
  try {
    const users = req.scope.resolve(Modules.USER) as any;
    const user = await users.retrieveUser(actor);
    return {
      required: BULK_APPLY_PERMISSION,
      granted: hasBulkApplyPermission(user.metadata),
      actor_id: actor,
    };
  } catch {
    return { required: BULK_APPLY_PERMISSION, granted: false, actor_id: actor };
  }
}
