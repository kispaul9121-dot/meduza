import { Metadata } from "next"
import { listReadyConfigurations } from "@lib/server-configurator/data"
import { ReadyConfigurationCard } from "@modules/server-configurator/ready-configuration-card"
import { ServerHeader } from "@modules/server-configurator/server-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Готовые серверные конфигурации",
  description: "Проверенные compatibility engine готовые конфигурации серверов для типовых задач.",
  alternates: { canonical: "/solutions" },
}

export default async function ReadyConfigurationsPage() {
  const ready = await listReadyConfigurations()
  const useCases = Array.from(new Set(ready.map((item) => item.use_case))).sort()
  return (
    <>
      <ServerHeader models={[]} annotations={[]} />
      <main className="server-page-shell">
        <header className="catalog-intro">
          <span>Готовые решения</span>
          <h1>Проверенные конфигурации</h1>
          <p>Каждая опубликованная сборка хранит неизменяемый технический snapshot и повторно проверяется при изменении базы совместимости.</p>
        </header>
        {useCases.length ? <nav className="catalog-category-links" aria-label="Сценарии использования">{useCases.map((item) => <a key={item} href={`#${item}`}>{item}</a>)}</nav> : null}
        {useCases.map((useCase) => (
          <section className="server-content-section" id={useCase} key={useCase}>
            <h2>{useCase}</h2>
            <div className="server-product-grid">{ready.filter((item) => item.use_case === useCase).map((item) => <ReadyConfigurationCard key={item.id} ready={item} />)}</div>
          </section>
        ))}
        {!ready.length ? <div className="honest-empty-state"><strong>Готовые конфигурации пока не опубликованы</strong><p>Каталог заполнится после production-валидации и публикации в административной панели.</p></div> : null}
      </main>
    </>
  )
}
