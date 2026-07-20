import { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  listHelpAnnotations,
  listServerModels,
  listConfiguratorOptions,
  productJsonLd,
  retrieveServerModel,
} from "@lib/server-configurator/data"
import { ConfiguratorClient } from "@modules/server-configurator/configurator-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export async function generateStaticParams() {
  const models = await listServerModels()
  return models.map((model) => ({ slug: model.slug }))
}

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

export default async function ServerConfiguratorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const model = await retrieveServerModel(slug)
  if (!model) notFound()
  const options = await listConfiguratorOptions(slug)
  const annotations = await listHelpAnnotations("configurator", slug)
  const navModels = await listServerModels()
  const jsonLd = productJsonLd(model)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServerHeader models={navModels} annotations={annotations} />
      <main className="server-page-shell">
        <nav className="server-breadcrumbs" aria-label="Breadcrumbs">
          <a href="/servers">Servers</a>
          <span>/</span>
          <span>{model.public_name}</span>
        </nav>
        <ConfiguratorClient model={model} options={options} annotations={annotations} navModels={navModels} />
      </main>
    </>
  )
}
