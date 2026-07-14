"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Cpu,
  Database,
  FileText,
  HardDrive,
  Heart,
  Menu,
  MemoryStick,
  Network,
  PackageCheck,
  Search,
  Server,
  Settings2,
  ShoppingCart,
  Wrench,
  X,
  Zap,
} from "lucide-react"
import { HelpAnnotation, ServerModel } from "@lib/server-configurator/data"
import { retrieveConfiguredCart } from "@lib/server-configurator/cart-api"
import { HelpPopover } from "./help-popover"
import { useServerLocalActions } from "./local-actions"
import { SERVER_CART_UPDATED_EVENT } from "./cart-events"

function HeaderCatalogDropdown({
  models,
  onNavigate,
}: {
  models: ServerModel[]
  onNavigate: () => void
}) {
  const [activeSection, setActiveSection] = useState("servers")
  const chassisItems = models.map((model) => ({
    label: model.public_name.replace("HPE ProLiant ", ""),
    href: `/servers/${model.slug}`,
  }))
  const sections = [
    { id: "servers", label: "Серверы", icon: Server, items: chassisItems },
    {
      id: "components",
      label: "Комплектующие",
      icon: Settings2,
      items: [
        { label: "Процессоры", href: "/servers?component=cpu", icon: Cpu },
        { label: "Память", href: "/servers?component=ram", icon: MemoryStick },
        { label: "Накопители", href: "/servers?component=drive" },
        { label: "RAID контроллеры", href: "/servers?component=raid" },
        { label: "Сетевые карты", href: "/servers?component=nic", icon: Network },
        { label: "Блоки питания", href: "/servers?component=psu", icon: Zap },
        { label: "Рельсы / кабели / райзеры", href: "/servers?component=accessories" },
      ],
    },
    {
      id: "storage",
      label: "СХД",
      icon: Database,
      items: [
        { label: "SAS/SATA корзины", href: "/servers?interface=SAS", icon: HardDrive },
        { label: "NVMe конфигурации", href: "/servers?interface=NVMe" },
        { label: "LFF под емкость", href: "/servers?drive_form_factor=3.5" },
        { label: "SFF под производительность", href: "/servers?drive_form_factor=2.5" },
        { label: "Universal Media Bay", href: "/servers?component=media-bay" },
      ],
    },
    {
      id: "solutions",
      label: "Готовые решения",
      icon: Boxes,
      items: [
        { label: "1U серверы", href: "/servers?form_factor=1U" },
        { label: "Под виртуализацию", href: "/servers?view=virtualization" },
        { label: "Под базы данных", href: "/servers?view=database" },
        { label: "Под файловое хранилище", href: "/servers?view=storage" },
      ],
    },
    {
      id: "service",
      label: "Сервис",
      icon: Wrench,
      items: [
        { label: "Получить КП", href: "/servers?quote=1", icon: FileText },
        { label: "Поставка под проект", href: "/servers?view=project" },
        { label: "Подбор аналогов", href: "/servers?view=analogs" },
        { label: "Сборка и тестирование", href: "/servers?view=assembly", icon: PackageCheck },
        { label: "Сервис и SLA", href: "/servers?view=service" },
      ],
    },
  ]
  const active = sections.find((item) => item.id === activeSection) || sections[0]

  return (
    <div className="catalog-mega" role="menu">
      <div className="mega-column mega-parents">
        <Link className="mega-all" href="/servers" onClick={onNavigate}>
          Все товары каталога
          <ArrowRight size={18} />
        </Link>
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              className={activeSection === section.id ? "selected" : ""}
              key={section.id}
              onMouseEnter={() => setActiveSection(section.id)}
              onFocus={() => setActiveSection(section.id)}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <Icon size={22} />
              <span>{section.label}</span>
              <ArrowRight size={17} />
            </button>
          )
        })}
      </div>
      <div className="mega-content">
        <section className="mega-link-column">
          <h3>{active.label}</h3>
          <div>
            {active.items.map((item) => {
              const ItemIcon = "icon" in item ? item.icon : undefined
              return (
                <Link href={item.href} key={`${active.id}-${item.label}`} onClick={onNavigate}>
                  {ItemIcon ? <ItemIcon size={17} /> : null}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export function ServerHeader({
  models = [],
  annotations = [],
}: {
  models?: ServerModel[]
  annotations?: HelpAnnotation[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const actions = useServerLocalActions()
  const [menuOpen, setMenuOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [cartCount, setCartCount] = useState(0)
  const catalogHelp = annotations.find((item) => item.key === "header.catalog_menu")
  const nav = useMemo(() => [
    ["Главная", "/servers"],
    ["Каталог", "/servers"],
    ["Конфигуратор", "/servers/hpe-proliant-dl360-gen10-8sff"],
    ["Готовые решения", "/servers?view=ready"],
    ["Комплектующие", "/servers?view=components"],
    ["СХД", "/servers?view=storage"],
    ["Сервис и SLA", "/servers?view=service"],
  ], [])

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchQuery.trim()
    if (query) router.push(`/servers?q=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    let active = true
    async function refreshCartCount() {
      const cart = await retrieveConfiguredCart()
      if (!active) return
      setCartCount((cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0))
    }
    refreshCartCount()
    window.addEventListener(SERVER_CART_UPDATED_EVENT, refreshCartCount)
    window.addEventListener("focus", refreshCartCount)
    return () => {
      active = false
      window.removeEventListener(SERVER_CART_UPDATED_EVENT, refreshCartCount)
      window.removeEventListener("focus", refreshCartCount)
    }
  }, [])

  return (
    <header className="server-site-header">
      <div className="server-topbar">
        <span>Поставка серверов под проекты</span>
        <span>Москва и регионы</span>
        <span>support@payloud.ru</span>
      </div>
      <div className="server-header-main">
        <button className="server-icon-button server-menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label="Открыть меню" type="button">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link className="server-brand" href="/servers">
          <span className="server-brand-mark">P</span>
          <span>Payloud</span>
        </Link>
        <div className={`catalog-dropdown-wrap ${catalogOpen ? "open" : ""}`}>
          <button
            className={`catalog-button ${catalogOpen ? "open" : ""}`}
            type="button"
            aria-expanded={catalogOpen}
            onClick={() => setCatalogOpen((value) => !value)}
          >
            <Menu size={18} />
            Меню
          </button>
          <HelpPopover annotation={catalogHelp} className="header-menu-help" />
          <HeaderCatalogDropdown models={models} onNavigate={() => setCatalogOpen(false)} />
        </div>
        <form className="server-search" onSubmit={submitSearch}>
          <Search size={18} />
          <input
            name="q"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Найти сервер, CPU, память или СХД"
          />
        </form>
        <div className="server-header-actions" aria-label="Быстрые действия">
          <button className="server-header-action" type="button" aria-label="Сравнение" onClick={() => router.push("/servers?view=compare")}>
            <BarChart3 size={18} />
            <span>{actions.counters.compare}</span>
          </button>
          <button className="server-header-action" type="button" aria-label="Избранное" onClick={() => router.push("/servers?view=favorites")}>
            <Heart size={18} />
            <span>{actions.counters.favorites}</span>
          </button>
          <button className="server-header-action" type="button" aria-label="Корзина" aria-live="polite" onClick={() => router.push("/servers?view=cart")}>
            <ShoppingCart size={18} />
            <span>{cartCount}</span>
          </button>
        </div>
        <button className="server-primary small server-quote-button" type="button" onClick={() => router.push("/servers?quote=1")}>
          <FileText size={18} />
          Получить КП
        </button>
      </div>
      <nav className={`server-category-nav ${menuOpen ? "open" : ""}`} aria-label="Основная навигация">
        <div className="server-nav-inner">
          {nav.map(([label, href]) => (
            <Link className={pathname === href ? "active" : ""} href={href} key={label}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
