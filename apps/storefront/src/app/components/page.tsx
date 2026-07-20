import type { Metadata } from "next"
import { listHelpAnnotations, queryComponentCatalog, queryServerCatalog } from "@lib/server-configurator/data"
import { ComponentCatalogView } from "@modules/server-configurator/component-catalog-view"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Комплектующие для серверов | Payloud", description: "Технический каталог серверных комплектующих.", alternates: { canonical: "/components" } }

export default async function ComponentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const parameters = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(parameters)) for (const entry of Array.isArray(value) ? value : value ? [value] : []) query.append(key, entry)
  const [catalog, nav, annotations] = await Promise.all([queryComponentCatalog(query), queryServerCatalog({ limit: "6" }), listHelpAnnotations("catalog")])
  return <><ServerHeader models={nav.items} annotations={annotations} /><main className="server-page-shell"><ComponentCatalogView catalog={catalog} query={query} /></main></>
}
