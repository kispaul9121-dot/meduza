import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyRaidAudit = legacyAuditSections.find((section) => section.key === "raid")!
