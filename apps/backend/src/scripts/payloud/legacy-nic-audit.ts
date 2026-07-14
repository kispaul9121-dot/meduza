import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyNicAudit = legacyAuditSections.find((section) => section.key === "nic")!
