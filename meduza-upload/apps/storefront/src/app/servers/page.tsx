import { Metadata } from "next"
import { listCatalogFacets, listHelpAnnotations, listServerModels } from "@lib/server-configurator/data"
import { ServerCatalogClient } from "@modules/server-configurator/catalog-client"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "HPE DL360 Gen10 servers | Payloud",
  description: "Catalog of HPE ProLiant DL360 Gen10 chassis/storage variants with server configurator.",
  alternates: { canonical: "/servers" },
  openGraph: {
    title: "HPE DL360 Gen10 servers",
    description: "Configure HPE DL360 Gen10 8SFF, 8SFF front option, 10SFF NVMe Premium and 4LFF.",
    type: "website",
  },
}

export default async function ServersPage() {
  const models = await listServerModels()
  const catalogModels = models.filter((model) => model.slug !== "hpe-proliant-dl360-gen10-8sff-front-drive-option")
  const annotations = await listHelpAnnotations("catalog")
  const facets = await listCatalogFacets()

  return (
    <>
      <ServerHeader models={catalogModels} annotations={annotations} />
      <main className="server-page-shell">
        <ServerCatalogClient models={catalogModels} annotations={annotations} facets={facets} />
      </main>
    </>
  )
}
