import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listHelpAnnotations, queryServerCatalog, retrieveComponent } from "@lib/server-configurator/data"
import { ComponentDetailView } from "@modules/server-configurator/component-catalog-view"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try { const { id } = await params; const item = await retrieveComponent(id); return { title: `${item.public_name} | Payloud`, description: `${item.brand} ${item.model}. Нормализованные технические характеристики.` } } catch { return {} }
}

export default async function ComponentDetailPage({ params }: { params: Promise<{ category: string; id: string }> }) {
  const { category, id } = await params
  try {
    const [item, nav, annotations] = await Promise.all([retrieveComponent(id), queryServerCatalog({ limit: "6" }), listHelpAnnotations("catalog")])
    if (!item.category_keys.includes(category)) notFound()
    return <><ServerHeader models={nav.items} annotations={annotations} /><main className="server-page-shell"><ComponentDetailView item={item} category={category} /></main></>
  } catch { notFound() }
}
