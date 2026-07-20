"use client"

import { FormEvent, useEffect, useState } from "react"
import { requestConfigurationQuote, type ConfigurationQuoteInput } from "@lib/server-configurator/cart-api"

type TechnicalDraft = Pick<ConfigurationQuoteInput,
  "server_model_slug" | "selected_components" | "storage_option_id" | "explicit_none" |
  "ready_configuration_id" | "ready_configuration_version" | "ready_snapshot_hash"
>

type SubmittedQuote = {
  id: string
  status: string
  availabilityWarnings: string[]
}

export function ConfigurationRfqForm({ initialDraft }: { initialDraft?: TechnicalDraft | null }) {
  const [draft, setDraft] = useState<TechnicalDraft | null>(initialDraft || null)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState<SubmittedQuote | null>(null)

  useEffect(() => {
    if (initialDraft) return
    const raw = window.localStorage.getItem("server-configurator-rfq-draft")
    if (!raw) return
    try { setDraft(JSON.parse(raw)) } catch { setDraft(null) }
  }, [initialDraft])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft || pending || submitted) return
    setPending(true)
    setMessage("")
    const data = new FormData(event.currentTarget)
    try {
      const result = await requestConfigurationQuote({
        ...draft,
        company_name: String(data.get("company_name") || ""),
        contact_name: String(data.get("contact_name") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || "") || undefined,
        quantity: Number(data.get("quantity") || 1),
        comments: String(data.get("comments") || "") || undefined,
      })
      setSubmitted({
        id: result.quote_request.id,
        status: result.quote_request.status,
        availabilityWarnings: Array.isArray(result.availability_warnings)
          ? result.availability_warnings.filter((warning): warning is string => typeof warning === "string" && warning.trim().length > 0)
          : [],
      })
      window.localStorage.removeItem("server-configurator-rfq-draft")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось зарегистрировать запрос.")
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <section className="server-summary-panel rfq-form space-y-5" role="status">
        <h2>Запрос коммерческого предложения зарегистрирован</h2>
        <p>Номер запроса: <strong>{submitted.id}</strong></p>
        <p>Статус: <strong>{submitted.status}</strong></p>
        {submitted.availabilityWarnings.length ? (
          <div className="server-summary-messages warning">
            <strong>Потребуется подтверждение доступности</strong>
            {submitted.availabilityWarnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        ) : (
          <p>На момент проверки блокирующих замечаний по доступности не найдено.</p>
        )}
        <p>RFQ хранится отдельно от корзины и не создаёт заказ или товар с нулевой ценой.</p>
      </section>
    )
  }

  if (!draft) return <div className="honest-empty-state"><strong>Конфигурация не выбрана</strong><p>Вернитесь в конфигуратор или выберите готовое решение.</p></div>

  return (
    <form className="server-summary-panel rfq-form space-y-5" onSubmit={submit}>
      <h2>Данные компании и контакта</h2>
      <p>Модель: <strong>{draft.server_model_slug}</strong>; компонентов: {draft.selected_components.length}</p>
      <label className="grid gap-2 font-medium">Компания<input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="company_name" required minLength={2} maxLength={200} autoComplete="organization" /></label>
      <label className="grid gap-2 font-medium">Контактное лицо<input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="contact_name" required minLength={2} maxLength={200} autoComplete="name" /></label>
      <label className="grid gap-2 font-medium">Email<input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="email" type="email" required maxLength={320} autoComplete="email" /></label>
      <label className="grid gap-2 font-medium">Телефон<input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="phone" type="tel" maxLength={80} autoComplete="tel" /></label>
      <label className="grid gap-2 font-medium">Количество серверов<input className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="quantity" type="number" min={1} max={10000} defaultValue={1} required /></label>
      <label className="grid gap-2 font-medium">Комментарий<textarea className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal" name="comments" maxLength={4000} rows={5} /></label>
      <p>RFQ хранится отдельно от корзины и не создаёт товар с нулевой ценой.</p>
      <button className="server-primary wide" type="submit" disabled={pending}>{pending ? "Проверяем и отправляем…" : "Отправить запрос КП"}</button>
      {message ? <p role="alert" className="server-summary-messages error">{message}</p> : null}
    </form>
  )
}
