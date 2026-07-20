export const sourceRoot =
  process.env.PAYLOUD_SOURCE_ROOT || "C:\\Users\\kampo\\OneDrive\\Documents\\pauloud 2"

export const dryRun = process.env.PAYLOUD_IMPORT_DRY_RUN === "true"

export const validComponentTypes = new Set([
  "cpu",
  "ram",
  "drive",
  "raid",
  "nic",
  "psu",
  "riser",
  "backplane",
  "rails",
  "cable",
  "cooling",
  "license",
  "service",
])

export const validRuleCategories = new Set([
  "cpu",
  "ram",
  "storage",
  "raid",
  "nic",
  "psu",
  "riser",
  "cooling",
  "backplane",
])

export const sourceFiles = {
  configurator: "src/data/configurator.js",
  componentsCore: "src/data/products/components-core.js",
  componentsMore: "src/data/products/components-more.js",
  dl360Servers: "src/data/products/hpeDl360Servers.js",
  storageScenarios: "src/lib/dl360StorageScenarios.js",
  optionAnnotations: "src/lib/configuratorOptionAnnotations.js",
  optionUiState: "src/lib/configuratorOptionUiState.js",
  backplaneSync: "src/lib/configuratorBackplaneSync.js",
  dl360Rules: "payload-cms/src/lib/rules/dl360TestingRulesetSeed.ts",
  dl360Nics: "payload-cms/src/lib/rules/dl360NicsSeed.ts",
  dl360Expansion: "payload-cms/src/lib/rules/dl360ExpansionOptionsSeed.ts",
  dl360PsuCooling: "payload-cms/src/lib/rules/dl360PsuCoolingSeed.ts",
  dl360Gpu: "payload-cms/src/lib/rules/dl360GpuSeed.ts",
}
