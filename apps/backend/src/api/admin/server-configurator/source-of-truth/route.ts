import { existsSync } from "fs"
import { join } from "path"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../modules/server-configurator"
import { runtimeFallbackStatus } from "../../../../modules/server-configurator/runtime-fallback-warning"

function countBy<T>(rows: T[], getKey: (row: T) => string) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const key = getKey(row)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [components, annotations, rules, presets, models] = await Promise.all([
    service.listComponents({}, { take: 10000 }),
    service.listHelpAnnotations({}, { take: 10000 }),
    service.listCompatibilityRules({}, { take: 10000 }),
    service.listRulePresets({}, { take: 10000 }),
    service.listServerModels({}, { take: 10000 }),
  ])
  const backendRoot = process.cwd()
  const fallbackFiles = [
    "src/modules/server-configurator/default-components.ts",
    "src/modules/server-configurator/default-help-annotations.ts",
  ].map((file) => ({
    file,
    exists: existsSync(join(backendRoot, file)),
    allowed_runtime_use: false,
    allowed_seed_import_use: true,
  }))
  const draftRules = rules.filter((rule: any) => !rule.enabled || rule.action_json?.draft === true)

  res.json({
    medusa_source_of_truth: "Medusa DB + server-configurator custom module",
    runtime_fallback: runtimeFallbackStatus(),
    counts: {
      server_models: models.length,
      components: components.length,
      components_by_type: countBy(components, (item: any) => item.type),
      help_annotations: annotations.length,
      compatibility_rules: rules.length,
      enabled_rules: rules.filter((rule: any) => rule.enabled).length,
      draft_rules: draftRules.length,
      rule_presets: presets.length,
    },
    fallback_files: fallbackFiles,
    db_first_endpoints: [
      "GET /store/server-configurator/models",
      "GET /store/server-configurator/models/:slug",
      "GET /store/server-configurator/models/:slug/options",
      "POST /store/server-configurator/validate",
      "POST /store/server-configurator/price",
      "POST /store/server-configurator/save",
      "GET /store/server-configurator/help-annotations",
      "GET /store/server-configurator/catalog-facets",
    ],
    warnings: [
      ...fallbackFiles
        .filter((file) => file.exists)
        .map((file) => `${file.file} exists and must remain seed/import-only.`),
      runtimeFallbackStatus().enabled
        ? "SERVER_CONFIGURATOR_DEV_FALLBACK=true is active. Disable it outside local development."
        : "",
    ].filter(Boolean),
  })
}
