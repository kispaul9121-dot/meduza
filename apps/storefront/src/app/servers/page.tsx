import { Metadata } from "next"
import { listHelpAnnotations, queryServerCatalog } from "@lib/server-configurator/data"
import { ServerCatalogClient } from "@modules/server-configurator/catalog-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Каталог серверов | Payloud",
  description: "Серверные платформы разных производителей с фильтрами по нормализованным характеристикам и конфигуратором совместимости.",
  alternates: { canonical: "/servers" },
  openGraph: {
    title: "Каталог серверных платформ",
    description: "Подберите сервер по производителю, платформе, CPU, памяти и storage-параметрам.",
    type: "website",
  },
}

export default async function ServersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const parameters = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(parameters)) {
    for (const entry of Array.isArray(value) ? value : value ? [value] : []) query.append(key, entry)
  }
  const [catalog, annotations] = await Promise.all([
    queryServerCatalog(query),
    listHelpAnnotations("catalog"),
  ])

  return (
    <>
      <ServerHeader models={catalog.items} annotations={annotations} />
      <main className="server-page-shell">
        <ServerCatalogClient
          annotations={annotations}
          initialCatalog={catalog}
          initialQuery={query.toString()}
        />
      </main>
    </>
  )
}
