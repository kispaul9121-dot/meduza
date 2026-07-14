import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyRamAudit = legacyAuditSections.find((section) => section.key === "ram")!
