"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Database,
  SlidersHorizontal,
} from "lucide-react"
import { sdk } from "@lib/config"
import type {
  ComponentOption,
  ConfiguratorContext,
  ConfiguratorOptionGroup,
  HelpAnnotation,
  ReadyConfiguration,
  ReadyConfiguratorState,
  ServerModel,
  StorageChoice,
} from "@lib/server-configurator/data"
import { ConfiguratorOverview } from "./configurator-overview"
import {
  ConfiguratorSummaryPanel,
  type CompatibilityValidation,
} from "./configurator-summary-panel"
import { HelpPopover } from "./help-popover"
import { PropertyList } from "./property-renderers"
import { ReadyConfigurationCard } from "./ready-configuration-card"
import { addConfiguredServerToCart } from "@lib/server-configurator/cart-api"

type Selected = Record<string, number>

function selectedPayload(selected: Selected) {
  return Object.entries(selected)
    .filter(([, quantity]) => quantity > 0)
    .map(([component_id, quantity]) => ({ component_id, quantity }))
}

function optionDescription(option: ComponentOption) {
  const specs = {
    ...(option.specs_json || {}),
    ...((
      option as ComponentOption & {
        normalized_specs_json?: Record<string, unknown>
      }
    ).normalized_specs_json || {}),
  }
  const details = [
    specs.cores && `${specs.cores} cores`,
    specs.tdp && `${specs.tdp} W`,
    specs.capacity,
    specs.form_factor,
    specs.interface,
    Array.isArray(specs.interfaces) && specs.interfaces.join(" / "),
  ].filter(Boolean)
  return details.length
    ? details.map(String).join(" · ")
    : option.short_name || "Технические параметры не указаны"
}

function StorageChoiceCard({
  choice,
  active,
  onChoose,
}: {
  choice: StorageChoice
  active: boolean
  onChoose: () => void
}) {
  const explicit = (value: unknown) =>
    value === "not_specified" || value === null || value === undefined
      ? "не указано"
      : String(value)
  return (
    <button
      className={`storage-choice-card ${active ? "selected" : ""}`}
      disabled={choice.disabled}
      type="button"
      aria-pressed={active}
      onClick={onChoose}
    >
      <span className="option-radio" aria-hidden="true" />
      <span className="storage-choice-copy">
        <strong>{choice.public_name}</strong>
        <small>
          {choice.total_bays ? `${choice.total_bays} отс. · ` : ""}
          {choice.form_factors.length
            ? choice.form_factors.join(" / ")
            : "форм-фактор не указан"}{" "}
          ·{" "}
          {choice.protocols.length
            ? choice.protocols.join(" / ")
            : "протокол не указан"}
        </small>
        <span>
          Контроллер: {explicit(choice.requirements.controller)} · Кабели:{" "}
          {explicit(choice.requirements.cables)}
        </span>
        {choice.conflicts.length ? (
          <span className="option-warning">
            Конфликты: {choice.conflicts.join(", ")}
          </span>
        ) : null}
        {choice.reason_codes.length ? (
          <span className="option-warning">
            {choice.reason_codes.join(", ")}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export function ConfiguratorClient({
  annotations = [],
  model,
  context,
  initialReadyState,
  readyConfigurations = [],
}: {
  annotations?: HelpAnnotation[]
  model: ServerModel
  navModels?: ServerModel[]
  context: ConfiguratorContext
  initialReadyState?: ReadyConfiguratorState | null
  readyConfigurations?: ReadyConfiguration[]
}) {
  const normalizedContext = useMemo(
    () => ({
      ...context,
      options: context.options || [],
      groups: context.groups || [],
      storage_choices: context.storage_choices || [],
      drive_suggestions: context.drive_suggestions || [],
    }),
    [context],
  )
  const [liveContext, setLiveContext] = useState(normalizedContext)
  const [selected, setSelected] = useState<Selected>(() => Object.fromEntries(
    (initialReadyState?.selected_components || []).map((item) => [item.component_id, item.quantity || 1]),
  ))
  const [explicitNone, setExplicitNone] = useState<string[]>(() =>
    initialReadyState?.explicit_none || normalizedContext.groups
      .filter((group) => group.none?.selected_by_default)
      .map((group) => group.key),
  )
  const [storageChoiceId, setStorageChoiceId] = useState(
    normalizedContext.storage_choices.find((choice) => choice.storage_option_id === initialReadyState?.storage_option_id)?.id || normalizedContext.storage_choices[0]?.id || "",
  )
  const [validation, setValidation] = useState<CompatibilityValidation | null>(
    null,
  )
  const [pending, setPending] = useState(false)
  const [optionError, setOptionError] = useState<string | null>(null)
  const [commerceMessage, setCommerceMessage] = useState("")
  const chosenItems = useMemo(
    () =>
      Object.entries(selected).flatMap(([id, quantity]) => {
        const option = liveContext.options.find((item) => item.id === id)
        return option ? [{ option, quantity }] : []
      }),
    [liveContext.options, selected],
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const query = new URLSearchParams()
      const values = selectedPayload(selected)
      if (values.length)
        query.set(
          "selected",
          values
            .map((item) => `${item.component_id}:${item.quantity}`)
            .join(","),
        )
      if (explicitNone.length)
        query.set("explicit_none", explicitNone.join(","))
      const storage = liveContext.storage_choices.find(
        (choice) => choice.id === storageChoiceId,
      )
      if (storage?.storage_option_id)
        query.set("storage_option_id", storage.storage_option_id)
      try {
        const next = await sdk.client.fetch<ConfiguratorContext>(
          `/store/server-configurator/models/${model.slug}/options?${query.toString()}`,
          { signal: controller.signal },
        )
        setLiveContext({
          ...next,
          options: next.options || [],
          groups: next.groups || [],
          storage_choices: next.storage_choices || [],
          drive_suggestions: next.drive_suggestions || [],
        })
        setOptionError(null)
      } catch (error) {
        if (!controller.signal.aborted)
          setOptionError(
            error instanceof Error
              ? error.message
              : "Не удалось обновить варианты совместимости.",
          )
      }
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
    // Selected values are the only input to the engine refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.slug, selected, explicitNone, storageChoiceId])

  function choose(group: ConfiguratorOptionGroup, option: ComponentOption) {
    if (option.disabled) return
    setValidation(null)
    setExplicitNone((current) => current.filter((key) => key !== group.key))
    setSelected((current) => {
      const next = { ...current }
      const one = ["zero_or_one", "exactly_one"].includes(
        group.selection_cardinality || "zero_or_one",
      )
      if (one) for (const candidate of group.options) delete next[candidate.id]
      if (
        current[option.id] &&
        !["exactly_one", "one_or_many"].includes(
          group.selection_cardinality || "",
        )
      )
        delete next[option.id]
      else next[option.id] = current[option.id] || 1
      return next
    })
  }

  function chooseNone(group: ConfiguratorOptionGroup) {
    setSelected((current) => {
      const next = { ...current }
      for (const option of group.options) delete next[option.id]
      return next
    })
    setExplicitNone((current) => Array.from(new Set([...current, group.key])))
    setValidation(null)
  }

  function setQuantity(option: ComponentOption, quantity: number) {
    setSelected((current) => ({
      ...current,
      [option.id]: Math.max(
        1,
        Math.min(Number(option.max_quantity || 99), quantity || 1),
      ),
    }))
    setValidation(null)
  }

  function chooseStorage(choice: StorageChoice) {
    setStorageChoiceId(choice.id)
    setSelected((current) => {
      const next = { ...current }
      for (const option of liveContext.options.filter((item) =>
        ["backplane", "drive_cage"].includes(item.type),
      ))
        delete next[option.id]
      if (choice.component_id) next[choice.component_id] = 1
      return next
    })
    setValidation(null)
  }

  async function validate() {
    setPending(true)
    try {
      const result = await sdk.client.fetch<CompatibilityValidation>(
        "/store/server-configurator/validate",
        {
          method: "POST",
          body: commercePayload(),
        },
      )
      setValidation(result)
    } catch (error) {
      setValidation({
        valid: false,
        errors: [
          error instanceof Error
            ? error.message
            : "Не удалось получить результат compatibility engine.",
        ],
        warnings: [],
      })
    } finally {
      setPending(false)
    }
  }

  function commercePayload() {
    const storage = liveContext.storage_choices.find((choice) => choice.id === storageChoiceId)
    return {
      server_model_slug: model.slug,
      selected_components: selectedPayload(selected),
      storage_option_id: storage?.storage_option_id || undefined,
      explicit_none: explicitNone,
    }
  }

  async function addToCart() {
    setPending(true)
    const result = await addConfiguredServerToCart({ ...commercePayload(), pricing_mode: "calculated" })
    setCommerceMessage(result.valid ? "Конфигурация добавлена в единую корзину." : result.errors.join(" "))
    setPending(false)
  }

  function requestQuote() {
    window.localStorage.setItem("server-configurator-rfq-draft", JSON.stringify(commercePayload()))
    window.location.assign("/rfq?draft=1")
  }

  const compatible = validation?.valid === true
  return (
    <div className="server-configurator-stack">
      <ConfiguratorOverview
        model={model}
        pending={pending}
        selectedItems={chosenItems}
        valid={compatible}
        onValidate={validate}
      />

      <nav className="server-pdp-section-nav" aria-label="Разделы карточки">
        <a href="#overview">Обзор</a>
        <a href="#configurator">Конфигуратор</a>
        <a href="#ready">Готовые конфигурации</a>
        <a href="#specs">Характеристики</a>
        <a href="#compatibility">Совместимость</a>
        <a href="#documents">Документы</a>
        <a href="#faq">FAQ</a>
      </nav>

      <section className="server-configurator-section" id="configurator">
        <div className="server-configurator-title">
          <span>Конфигуратор</span>
          <h2>Соберите конфигурацию</h2>
          <p>
            Варианты поступают из backend compatibility engine. Недоступные
            опции сохраняют код причины.
          </p>
        </div>
        {optionError ? (
          <div className="server-summary-messages error" role="alert">
            {optionError}
          </div>
        ) : null}
        {liveContext.storage_choices.length ? (
          <section className="server-configurator-group storage-topology-group">
            <div className="group-title">
              <Database size={20} />
              <div>
                <h3>Топология накопителей</h3>
                <p>
                  Выберите понятный вариант — контроллеры, кабели и конфликты
                  разрешаются на backend.
                </p>
              </div>
            </div>
            <div className="storage-choice-grid">
              {liveContext.storage_choices.map((choice) => (
                <StorageChoiceCard
                  choice={choice}
                  active={choice.id === storageChoiceId}
                  onChoose={() => chooseStorage(choice)}
                  key={choice.id}
                />
              ))}
            </div>
          </section>
        ) : null}
        <div className="configurator-main-grid">
          <div className="configurator-groups-column">
            {liveContext.groups.map((group, index) => (
              <details
                className="server-configurator-group"
                open={index === 0}
                key={group.key}
              >
                <summary>
                  <span className="group-title">
                    <SlidersHorizontal size={20} />
                    <span>
                      <strong>
                        {group.title || group.label}{" "}
                        <HelpPopover
                          annotation={annotations.find(
                            (item) =>
                              item.component_type === group.component_type,
                          )}
                        />
                      </strong>
                      <small>{group.options.length} вариантов</small>
                    </span>
                  </span>
                  <ChevronDown size={18} />
                </summary>
                <div className="server-option-list">
                  {group.none ? (
                    <button
                      className={`server-option-row ${explicitNone.includes(group.key) ? "selected" : ""}`}
                      type="button"
                      aria-pressed={explicitNone.includes(group.key)}
                      onClick={() => chooseNone(group)}
                    >
                      <span className="option-radio" />
                      <span>
                        <strong>{group.none.label}</strong>
                        <small>Явный выбор: опция не требуется</small>
                      </span>
                    </button>
                  ) : null}
                  {group.options.map((option) => {
                    const active = Boolean(selected[option.id])
                    return (
                      <div
                        className={`server-option-row ${active ? "selected" : ""} ${option.disabled ? "disabled" : ""}`}
                        key={option.id}
                      >
                        <button
                          type="button"
                          disabled={option.disabled}
                          aria-pressed={active}
                          onClick={() => choose(group, option)}
                        >
                          <span className="option-radio" />
                          <span>
                            <strong>{option.public_name}</strong>
                            <small>{optionDescription(option)}</small>
                            {option.reason_codes?.length ? (
                              <em>{option.reason_codes.join(", ")}</em>
                            ) : null}
                          </span>
                        </button>
                        {active && Number(option.max_quantity || 1) > 1 ? (
                          <label className="option-quantity">
                            Кол-во
                            <input
                              type="number"
                              min="1"
                              max={option.max_quantity}
                              value={selected[option.id]}
                              onChange={(event) =>
                                setQuantity(option, Number(event.target.value))
                              }
                            />
                          </label>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </details>
            ))}
            {!liveContext.groups.length ? (
              <div className="server-empty-state">
                <strong>Опции пока не опубликованы</strong>
                <p>
                  Для этой модели нет доступных кандидатов из назначенных
                  component packs.
                </p>
              </div>
            ) : null}
          </div>
          <ConfiguratorSummaryPanel
            model={model}
            pending={pending}
            selectedItems={chosenItems}
            validation={validation}
            valid={compatible}
            message={commerceMessage}
            onValidate={validate}
            onAddToCart={addToCart}
            onRequestQuote={requestQuote}
          />
        </div>
      </section>

      <section className="server-content-section" id="ready">
        <h2>Готовые конфигурации</h2>
        {readyConfigurations.length ? <div className="server-product-grid">
          {readyConfigurations.map((ready) => <ReadyConfigurationCard ready={ready} key={ready.id} />)}
        </div> : <div className="honest-empty-state">
          <strong>Пока не опубликованы</strong>
          <p>
            Сохранённые готовые сборки появятся здесь после отдельного процесса
            публикации.
          </p>
        </div>}
      </section>
      <section className="server-content-section" id="specs">
        <h2>Характеристики</h2>
        <PropertyList properties={model.presentation_properties || []} />
      </section>
      <section className="server-content-section" id="compatibility">
        <h2>Совместимость</h2>
        <div
          className={`compatibility-result ${validation ? (compatible ? "valid" : "invalid") : "pending"}`}
        >
          {validation ? (
            compatible ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertTriangle size={22} />
            )
          ) : (
            <SlidersHorizontal size={22} />
          )}
          <div>
            <strong>
              {validation
                ? compatible
                  ? "Конфигурация совместима"
                  : "Найдены ограничения"
                : "Проверка ещё не запускалась"}
            </strong>
            <p>
              {validation
                ? [...validation.errors, ...validation.warnings].join(" ") ||
                  "Compatibility engine не вернул замечаний."
                : "Выберите компоненты и нажмите «Проверить совместимость»."}
            </p>
          </div>
        </div>
      </section>
      <section className="server-content-section" id="documents">
        <h2>Документы</h2>
        {model.source_doc_reference ? (
          <p>
            Источник технических данных:{" "}
            <code>{model.source_doc_reference}</code>
          </p>
        ) : (
          <p>Ссылка на документ-источник не указана.</p>
        )}
      </section>
      <section className="server-content-section" id="faq">
        <h2>Частые вопросы</h2>
        <details>
          <summary>Как определяется совместимость?</summary>
          <p>
            Backend объединяет назначения модели, component packs, свойства,
            связи, ресурсы и правила. Интерфейс только показывает результат и
            коды причин.
          </p>
        </details>
        <details>
          <summary>Что означает «информационно»?</summary>
          <p>
            Свойство опубликовано для сравнения или описания, но не участвует в
            утверждении о совместимости, пока не связано с валидатором.
          </p>
        </details>
      </section>
    </div>
  )
}
