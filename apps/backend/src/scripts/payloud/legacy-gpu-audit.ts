import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyGpuAudit = legacyAuditSections.find((section) => section.key === "gpu")!
