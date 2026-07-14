import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { legacyAuditReportData } from "../../../../../scripts/payloud/legacy-audit-report"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const data = legacyAuditReportData()
  res.json({ sections: data.sections, recommended_data_model_changes: data.recommended_data_model_changes })
}
