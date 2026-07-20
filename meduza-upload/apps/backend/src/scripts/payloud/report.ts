import { dryRun, sourceRoot } from "./source-files"

export const report = {
  dry_run: dryRun,
  source_root: sourceRoot,
  files_read: [] as string[],
  components: {
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    duplicates: 0,
    by_type: {} as Record<string, number>,
  },
  annotations: {
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
  },
  rules: {
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
  },
  presets: {
    found: 0,
    created: 0,
    updated: 0,
    unchanged: 0,
  },
  skipped: [] as Array<{ source: string; item: string; reason: string }>,
  duplicates: [] as Array<{ key: string; source: string; item: string }>,
  unmapped_fields: [] as string[],
}
