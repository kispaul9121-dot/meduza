import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { VENDOR_ADAPTERS } from "../../../../../modules/server-configurator/import-pipeline";
import { BULK_APPLY_PERMISSION } from "../../../../../modules/server-configurator/import-apply";

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    adapters: Object.values(VENDOR_ADAPTERS).map((adapter) => ({
      key: adapter.key,
      request_key: adapter.vendor.toLowerCase(),
      vendor: adapter.vendor,
      schema_version: adapter.schema_version,
      layers: ["raw", "staging", "normalized"],
      pipeline: ["extract", "normalize", "validate", "mapping", "dedupe", "preview", "review", "transactional_apply", "post_validation"],
    })),
    commercial_boundary: {
      protected_fields: ["sku", "price", "cost", "inventory", "categories", "images"],
      owner: "Medusa commercial import",
    },
    apply_permission: BULK_APPLY_PERMISSION,
  });
}
