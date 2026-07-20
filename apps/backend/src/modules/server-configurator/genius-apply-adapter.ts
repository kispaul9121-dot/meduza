import { MedusaError } from "@medusajs/framework/utils";

export type GeniusApplyContext = {
  manifest: Record<string, any>;
  idempotency_key: string;
  actor_id: string;
  approved_groups: string[];
};

export type GeniusDryRunResult = {
  adapter_version: 1;
  stage: "07" | "08";
  apply_available: false;
  writes_performed: false;
  idempotency_key: string;
  approved_item_count: number;
  blockers: any[];
  warnings: any[];
  dependency_order: string[];
};

export interface GeniusManifestApplyAdapter {
  capabilities(): {
    dry_run: true;
    apply: boolean;
    transactional_apply_owner: "stage-08-import-pipeline";
  };
  dryRun(input: GeniusApplyContext): Promise<GeniusDryRunResult>;
  apply(input: GeniusApplyContext): Promise<never>;
}

export class Stage07DryRunAdapter implements GeniusManifestApplyAdapter {
  capabilities() {
    return {
      dry_run: true as const,
      apply: false,
      transactional_apply_owner: "stage-08-import-pipeline" as const,
    };
  }

  async dryRun(input: GeniusApplyContext): Promise<GeniusDryRunResult> {
    const groups = [
      "concepts_and_aliases",
      "property_definitions",
      "property_assignments",
      "relations",
      "platform",
      "generation",
      "components",
      "packs",
      "storage_options",
      "server_model",
      "product_links",
      "revalidation_tasks",
    ];
    const items = [
      ...(input.manifest.planned_creates || []),
      ...(input.manifest.planned_updates || []),
      ...(input.manifest.planned_links || []),
      ...(input.manifest.planned_assignments || []),
    ];
    return {
      adapter_version: 1,
      stage: "07",
      apply_available: false,
      writes_performed: false,
      idempotency_key: input.idempotency_key,
      approved_item_count: items.filter(
        (item) =>
          !input.approved_groups.length ||
          input.approved_groups.includes(item.group || item.entity_type),
      ).length,
      blockers: input.manifest.blockers || [],
      warnings: input.manifest.warnings || [],
      dependency_order: groups,
    };
  }

  async apply(_input: GeniusApplyContext): Promise<never> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Bulk Apply is intentionally unavailable until the stage-08 transactional import adapter is installed.",
    );
  }
}

export class Stage08ReviewedImportAdapter extends Stage07DryRunAdapter {
  async dryRun(input: GeniusApplyContext): Promise<GeniusDryRunResult> {
    const result = await super.dryRun(input);
    return {
      ...result,
      stage: "08",
      blockers: [
        ...result.blockers,
        {
          code: "IMPORT_REVIEW_REQUIRED",
          message:
            "Stage the shared manifest in Technical Import, review classifications, then use the permission-gated transactional apply endpoint.",
          publication_blocking: false,
        },
      ],
    };
  }

  async apply(_input: GeniusApplyContext): Promise<never> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "A Genius manifest must pass stage-08 import review before transactional apply.",
    );
  }
}
