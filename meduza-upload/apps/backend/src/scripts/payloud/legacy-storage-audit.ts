import { legacyAuditSections } from "./legacy-logic-audit"

export const legacyStorageAudit = legacyAuditSections.filter((section) => ["storage", "backplane-media-bay"].includes(section.key))
