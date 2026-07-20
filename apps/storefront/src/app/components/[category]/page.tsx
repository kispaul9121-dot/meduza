import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listHelpAnnotations, queryComponentCatalog, queryServerCatalog } from "@lib/server-configurator/data"
import { ComponentCatalogView } from "@modules/server-configurator/component-catalog-view"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  return { title: `${category} — комплектующие | Payloud`, alternates: { canonical: `/components/${category}` } }
}

export default async function ComponentCategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category } = await params
  const parameters = await searchParams
  const query = new URLSearchParams({ category })
  const displayQuery = new URLSearchParams()
  for (const [key, value] of Object.entries(parameters)) for (const entry of Array.isArray(value) ? value : value ? [value] : []) { query.append(key, entry); displayQuery.append(key, entry) }
  try {
    const [catalog, nav, annotations] = await Promise.all([queryComponentCatalog(query), queryServerCatalog({ limit: "6" }), listHelpAnnotations("catalog")])
    return <><ServerHeader models={nav.items} annotations={annotations} /><main className="server-page-shell"><ComponentCatalogView catalog={catalog} category={category} query={displayQuery} /></main></>
  } catch { notFound() }
}
