"use client"

import {
  ArrowDownTray,
  ChartBar,
  Check,
  DocumentText,
  Envelope,
  Heart,
  PaperPlane,
  ShieldCheck,
  ShoppingCart,
  TruckFast,
} from "@medusajs/icons"
import { ComponentOption, ServerModel } from "@lib/server-configurator/data"
import { formatPrice } from "@lib/server-configurator/format"
import { useServerLocalActions } from "./local-actions"

type SelectedItem = {
  option: ComponentOption
  quantity: number
}

export function ConfiguratorOverview({
  model,
  pending,
  selectedItems,
  total,
  valid,
  onRequestQuote,
}: {
  model: ServerModel
  pending: boolean
  selectedItems: SelectedItem[]
  total: number
  valid: boolean
  onRequestQuote: () => void
}) {
  const actions = useServerLocalActions(model.slug)
  const chassis = `${model.drive_bays_front}${model.drive_form_factor === "3.5" ? "LFF" : "SFF"} ${model.backplane_type}`
  const driveSize = model.drive_form_factor === "3.5" ? "LFF" : "SFF"
  const modelText = [model.slug, model.chassis_type, model.backplane_type, model.front_option_type].filter(Boolean).join(" ").toLowerCase()
  const isTenSffPremium = modelText.includes("10sff") || modelText.includes("premium")
  const isFourLff = modelText.includes("4lff")
  const backplaneLine = isTenSffPremium
    ? "Backplane: 10SFF NVMe Premium front cage, SAS/SATA/NVMe"
    : isFourLff
      ? "Backplane: 4LFF SAS/SATA; Media Bay не используется"
      : "Backplane: 8SFF SAS/SATA; NVMe через Media Bay/enablement path"
  const mediaLine = isTenSffPremium
    ? "Media Bay: не отдельная опция для этой 10SFF Premium карточки"
    : isFourLff
      ? "Storage: 3.5-inch LFF и 2.5-inch SAS/SATA SSD через adapter path"
      : "Media Bay: +2 SFF, +2 NVMe, Dual uFF M.2 или ODD/USB/DP blank"
  const condition = "Восстановленный"
  const stockLabel = valid ? "В наличии" : "Проверка"

  function requestQuote() {
    actions.requestQuote()
    onRequestQuote()
  }

  function downloadConfiguration() {
    const payload = {
      model: model.public_name,
      slug: model.slug,
      total,
      valid,
      selected_items: selectedItems.map((item) => ({
        type: item.option.type,
        name: item.option.public_name,
        quantity: item.quantity,
        price: item.option.price,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${model.slug}-configuration.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="server-overview payloud-overview" aria-label="Область просмотра сервера">
      <div className="server-platform-card">
        <div className="server-media-copy">
          <div className="server-viewer">
            <div className="server-illustration overview-main" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="photo-staging">
              <span>Область для фотографий платформы</span>
              <p>Здесь можно будет разместить ракурсы, маркировку корзин и фото комплектующих.</p>
            </div>
          </div>

          <div className="overview-info">
            <div className="overview-info-card">
              <h3>Характеристики</h3>
              <ul>
                <li>{model.form_factor} / {model.cpu_socket} / до {model.max_cpu} CPU</li>
                <li>Память: до {model.max_ram_capacity}, {model.ram_slots_total} DIMM DDR4 ECC</li>
                <li>Корзина: {chassis}, {model.drive_bays_front} x {driveSize}</li>
                <li>{backplaneLine}</li>
                <li>{mediaLine}</li>
                <li>PSU: 500W / 800W / 1600W Flex Slot Hot Plug</li>
                <li>Cooling: Standard или Performance по TDP CPU</li>
              </ul>
            </div>

            <div className="overview-info-card">
              <h3>Руководство пользователя</h3>
              <div className="overview-docs">
                <button type="button">
                  <DocumentText aria-hidden="true" />
                  Техническое руководство {model.public_name}.pdf
                </button>
                <button type="button">
                  <DocumentText aria-hidden="true" />
                  Datasheet {model.public_name}.pdf
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="config-commerce-card" aria-label="Цена и запрос коммерческого предложения">
        <div className="commerce-labels">
          <span>{condition}</span>
          <span className={valid ? "available" : "preorder"}>{stockLabel}</span>
        </div>

        <div className="commerce-price">
          <small>Текущая конфигурация</small>
          <strong>{pending ? "Расчет..." : formatPrice(total)}</strong>
          <p>НДС и финальная стоимость подтверждаются после проверки наличия и совместимости.</p>
        </div>

        <div className="commerce-actions">
          <button className="server-primary wide commerce-action-button" type="button" onClick={requestQuote}>
            Отправить запрос
            <PaperPlane aria-hidden="true" />
          </button>
          <button className="server-secondary wide commerce-action-button" type="button" onClick={requestQuote}>
            Отправить КП себе на почту
            <Envelope aria-hidden="true" />
          </button>
          <button className="server-secondary wide commerce-action-button" type="button" onClick={downloadConfiguration}>
            Скачать конфигурацию
            <ArrowDownTray aria-hidden="true" />
          </button>
        </div>

        <div className="commerce-mini-actions">
          <button className={actions.isFavorite ? "active" : ""} type="button" aria-label="Добавить в избранное" aria-pressed={actions.isFavorite} onClick={() => actions.toggleFavorite()}>
            <Heart aria-hidden="true" />
          </button>
          <button className={actions.isCompared ? "active" : ""} type="button" aria-label="Добавить в сравнение" aria-pressed={actions.isCompared} onClick={() => actions.toggleCompare()}>
            <ChartBar aria-hidden="true" />
          </button>
          <button type="button" aria-label="Добавить в корзину" onClick={() => actions.addToCart()}>
            <ShoppingCart aria-hidden="true" />
          </button>
        </div>

        <div className="commerce-contact">
          <span>Связаться с менеджером</span>
          <div>
            <button type="button" aria-label="Telegram">
              <PaperPlane aria-hidden="true" />
            </button>
            <button type="button" aria-label="Чат">
              <Envelope aria-hidden="true" />
            </button>
            <button type="button" aria-label="Email">
              <Envelope aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="commerce-features">
          <span><ShieldCheck aria-hidden="true" /> Гарантия 1 год с заменой компонентов</span>
          <span><TruckFast aria-hidden="true" /> Доставка СДЭК и ведущими службами</span>
          <span><Check aria-hidden="true" /> Тестирование оборудования перед отправкой</span>
        </div>
      </aside>
    </section>
  )
}
