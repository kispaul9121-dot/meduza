import { Metadata } from "next"
import { retrieveReadyConfiguration } from "@lib/server-configurator/data"
import { ServerHeader } from "@modules/server-configurator/server-header"
import { ConfigurationRfqForm } from "@modules/server-configurator/rfq-form"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Запрос коммерческого предложения", alternates: { canonical: "/rfq" } }

export default async function RfqPage({ searchParams }: { searchParams: Promise<{ ready?: string }> }) {
  const { ready: readySlug } = await searchParams
  const ready = readySlug ? await retrieveReadyConfiguration(readySlug) : null
  const initialDraft = ready ? {
    server_model_slug: ready.version.snapshot.server_model.slug,
    selected_components: ready.version.snapshot.selected_components.map((item) => ({ component_id: item.component_id, quantity: item.quantity, type: item.type || undefined })),
    storage_option_id: ready.version.snapshot.topology.storage_option_id || undefined,
    explicit_none: ready.version.snapshot.explicit_none,
    ready_configuration_id: ready.id,
    ready_configuration_version: ready.version.version,
    ready_snapshot_hash: ready.version.snapshot_hash,
  } : null
  return <><ServerHeader models={[]} annotations={[]} /><main className="server-page-shell"><header className="catalog-intro"><span>B2B RFQ</span><h1>Запрос коммерческого предложения</h1><p>Совместимость, актуальная цена и доступность повторно проверяются на сервере перед регистрацией запроса.</p></header><ConfigurationRfqForm initialDraft={initialDraft} /></main></>
}
