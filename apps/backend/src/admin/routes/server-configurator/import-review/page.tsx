import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { ImportReviewTabs } from "./import-review-tabs"

const ImportReviewPage = () => {
  return <ImportReviewTabs />
}

export const config = defineRouteConfig({
  label: "Import Review",
  icon: DocumentText,
})

export default ImportReviewPage
