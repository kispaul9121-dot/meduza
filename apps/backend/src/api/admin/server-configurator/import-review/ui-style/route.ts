import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { legacyAuditReportData } from "../../../../../scripts/payloud/legacy-audit-report"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const data = legacyAuditReportData()
  res.json({ ui_style: data.ui_style })
}
