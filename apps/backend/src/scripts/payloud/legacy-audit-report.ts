import { legacyAuditSections } from "./legacy-logic-audit"
import { legacyUiStyleFindings } from "./legacy-ui-style-audit"

export function legacyAuditReportData() {
  return {
    generated_at: new Date().toISOString(),
    sections: legacyAuditSections,
    ui_style: legacyUiStyleFindings,
    recommended_data_model_changes: [
      {
        change: "Add component.type = gpu",
        why: "Legacy rules/facts include GPUs, power cables, risers and cooling requirements.",
        migration_required: true,
        risk: "medium",
        temporary_specs_json_solution: false,
      },
      {
        change: "Add component.type = media_bay",
        why: "Legacy storage scenarios keep Media Bay separate from base backplane.",
        migration_required: true,
        risk: "medium",
        temporary_specs_json_solution: true,
      },
      {
        change: "Add component_group / logical option group",
        why: "Storefront needs Backplane and Media Bay as separate groups even before enum migration.",
        migration_required: false,
        risk: "low",
        temporary_specs_json_solution: true,
      },
      {
        change: "Add placement, slot_type, vendor_platform, supported_interfaces",
        why: "RAID/NIC/GPU compatibility depends on placement, platform and interface support.",
        migration_required: true,
        risk: "medium",
        temporary_specs_json_solution: true,
      },
      {
        change: "Add requires_components and effective_specs_json",
        why: "Legacy facts generate derived values and required accessories.",
        migration_required: true,
        risk: "medium",
        temporary_specs_json_solution: true,
      },
    ],
  }
}
