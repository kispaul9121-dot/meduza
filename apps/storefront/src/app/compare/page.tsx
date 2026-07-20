import { Metadata } from "next"

import { listHelpAnnotations, queryServerCatalog } from "@lib/server-configurator/data"
import { CompareCollection } from "@modules/server-configurator/collections-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Сравнение серверов | Payloud",
  alternates: { canonical: "/compare" },
}

export default async function ServerComparePage() {
  const [catalog, annotations] = await Promise.all([
    queryServerCatalog({ limit: "6", sort: "name_asc" }),
    listHelpAnnotations("catalog"),
  ])

  return (
    <>
      <ServerHeader models={catalog.items} annotations={annotations} />
      <main className="server-page-shell">
        <CompareCollection />
      </main>
    </>
  )
}
