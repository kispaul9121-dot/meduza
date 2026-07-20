import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyCpuAudit = legacyAuditSections.find((section) => section.key === "cpu")!
