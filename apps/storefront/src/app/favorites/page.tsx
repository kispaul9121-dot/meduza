import { Metadata } from "next"

import { listHelpAnnotations, queryServerCatalog } from "@lib/server-configurator/data"
import { FavoritesCollection } from "@modules/server-configurator/collections-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Избранные серверы | Payloud",
  alternates: { canonical: "/favorites" },
}

export default async function ServerFavoritesPage() {
  const [catalog, annotations] = await Promise.all([
    queryServerCatalog({ limit: "6", sort: "name_asc" }),
    listHelpAnnotations("catalog"),
  ])

  return (
    <>
      <ServerHeader models={catalog.items} annotations={annotations} />
      <main className="server-page-shell">
        <FavoritesCollection />
      </main>
    </>
  )
}
