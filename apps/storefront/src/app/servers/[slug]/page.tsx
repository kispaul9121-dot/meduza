import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  listHelpAnnotations,
  listReadyConfigurations,
  listConfiguratorContext,
  productJsonLd,
  queryServerCatalog,
  retrieveServerModel,
  retrieveReadyConfiguratorState,
} from "@lib/server-configurator/data"
import { ConfiguratorClient } from "@modules/server-configurator/configurator-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const model = await retrieveServerModel(slug)
  if (!model) return {}

  return {
    title: model.seo_title,
    description: model.seo_description,
    alternates: { canonical: `/servers/${model.slug}` },
    openGraph: {
      title: model.seo_title,
      description: model.seo_description,
      type: "website",
    },
  }
}

export default async function ServerConfiguratorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ready?: string }> }) {
  const { slug } = await params
  const { ready } = await searchParams
  const model = await retrieveServerModel(slug)
  if (!model) notFound()
  const [context, annotations, navCatalog, readyConfigurations, initialReadyState] = await Promise.all([
    listConfiguratorContext(slug),
    listHelpAnnotations("configurator", slug),
    queryServerCatalog({ limit: "6", sort: "name_asc" }),
    listReadyConfigurations({ server_model_slug: slug }),
    ready ? retrieveReadyConfiguratorState(ready) : Promise.resolve(null),
  ])
  const jsonLd = productJsonLd(model)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServerHeader models={navCatalog.items} annotations={annotations} />
      <main className="server-page-shell">
        <nav className="server-breadcrumbs" aria-label="Breadcrumbs">
          <Link href="/servers">Servers</Link>
          <span>/</span>
          <span>{model.public_name}</span>
        </nav>
        <ConfiguratorClient model={model} context={context} annotations={annotations} navModels={navCatalog.items} readyConfigurations={readyConfigurations} initialReadyState={initialReadyState} />
      </main>
    </>
  )
}
