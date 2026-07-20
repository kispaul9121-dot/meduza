import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { retrieveReadyConfiguration } from "@lib/server-configurator/data"
import { ReadyConfigurationActions } from "@modules/server-configurator/ready-configuration-actions"
import { PropertyList } from "@modules/server-configurator/property-renderers"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ready = await retrieveReadyConfiguration(slug)
  if (!ready) return {}
  return { title: ready.seo_title || ready.name, description: ready.seo_description || ready.description || undefined, alternates: { canonical: `/solutions/${ready.slug}` } }
}

export default async function ReadyConfigurationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ready = await retrieveReadyConfiguration(slug)
  if (!ready) notFound()
  const snapshot = ready.version.snapshot
  const properties = Object.entries(snapshot.effective_specs || {}).map(([key, value]) => ({ key, label: key, value_type: typeof value === "number" ? "number" as const : typeof value === "boolean" ? "boolean" as const : "object" as const, value, unit: null, comparable: true, state: "value" as const, compatibility_status: "engine_mapped" as const, inherited: false }))
  return (
    <>
      <ServerHeader models={[]} annotations={[]} />
      <main className="server-page-shell">
        <nav className="server-breadcrumbs"><Link href="/solutions">Готовые решения</Link><span>/</span><span>{ready.name}</span></nav>
        <header className="catalog-intro"><span>{ready.use_case}</span><h1>{ready.name}</h1><p>{ready.description}</p></header>
        <ReadyConfigurationActions ready={ready} />
        <section className="server-content-section"><h2>Состав</h2><div className="ready-composition-list">{snapshot.selected_components.map((item) => <article key={item.component_id}><strong>{item.quantity} × {item.public_name || item.component_id}</strong><p>{item.part_number || item.type || "Компонент"}</p></article>)}</div></section>
        <section className="server-content-section"><h2>Эффективные характеристики</h2><PropertyList properties={properties} /></section>
        <section className="server-content-section"><h2>Проверка версии</h2><p>Engine: {ready.version.engine_version} · snapshot v{ready.version.version} · hash {ready.version.snapshot_hash.slice(0, 12)}</p>{snapshot.validation.warnings.length ? <p>Предупреждения: {snapshot.validation.warnings.join(" ")}</p> : <p>Compatibility engine не сохранил предупреждений.</p>}</section>
      </main>
    </>
  )
}
