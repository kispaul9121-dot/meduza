"use client"

import { sdk } from "@lib/config"
import { addConfiguredServerToCart } from "@lib/server-configurator/cart-api"
import { SERVER_CART_UPDATED_EVENT } from "./cart-events"
import { ComponentOption, HelpAnnotation, ServerModel } from "@lib/server-configurator/data"
import { formatPrice } from "@lib/server-configurator/format"
import { SlidersHorizontal } from "lucide-react"
import { type KeyboardEvent, useMemo, useState } from "react"
import {
  configuratorGroups,
  filterControls,
  filterDriveOptions,
  filterOptions,
  filterRaidOptions,
  groupOptions,
  optionDriveKind,
  optionLine,
  optionMemorySpeed,
  optionNetworkSlot,
  optionRaidCache,
  optionRaidControllerKind,
  optionStorageInterface,
} from "./configurator-groups"
import { ConfiguratorOverview } from "./configurator-overview"
import { ConfiguratorSummaryPanel } from "./configurator-summary-panel"
import { HelpPopover } from "./help-popover"

type Selection = Record<string, { option: ComponentOption; quantity: number } | undefined>
type MultiSelection = Record<string, Record<string, { option: ComponentOption; quantity: number }>>
type StorageFilters = { kind: string; interface: string }
type RaidFilters = { kind: string; cache: string; interface: string }

function optionSearchText(option: ComponentOption) {
  const specs = option.specs_json || {}
  return [
    option.public_name,
    option.short_name,
    option.model,
    specs.interface,
    specs.cooling_type,
    specs.accessory_type,
    specs.required_riser_type,
    specs.interfaces?.join?.(" "),
  ].filter(Boolean).join(" ").toLowerCase()
}

function modelSearchText(model: ServerModel) {
  return [model.slug, model.chassis_type, model.backplane_type, model.front_option_type].filter(Boolean).join(" ").toLowerCase()
}

function isTenSffPremium(model: ServerModel) {
  const text = modelSearchText(model)
  return text.includes("10sff") || text.includes("premium")
}

function isFourLff(model: ServerModel) {
  return modelSearchText(model).includes("4lff")
}

function preferredBaseBackplane(group: ComponentOption[], model: ServerModel) {
  const nonMedia = group.filter((option) => !option.specs_json?.media_bay)
  const textFor = (option: ComponentOption) => optionSearchText(option)
  if (isTenSffPremium(model)) {
    return nonMedia.find((option) => textFor(option).includes("10sff") && textFor(option).includes("premium"))
      || nonMedia.find((option) => textFor(option).includes("nvme") && !textFor(option).includes("rear"))
      || nonMedia[0]
  }
  if (isFourLff(model)) {
    return nonMedia.find((option) => textFor(option).includes("lff") || textFor(option).includes("sas/sata"))
      || nonMedia.find((option) => !textFor(option).includes("nvme") && !textFor(option).includes("rear"))
      || nonMedia[0]
  }
  return nonMedia.find((option) => textFor(option).includes("sas/sata backplane"))
    || nonMedia.find((option) => !textFor(option).includes("nvme") && !textFor(option).includes("rear"))
    || nonMedia[0]
}

function driveBayDisplayOptions(group: ComponentOption[], model: ServerModel) {
  const base = preferredBaseBackplane(group, model)
  if (isTenSffPremium(model) || isFourLff(model)) {
    return [base].filter(Boolean) as ComponentOption[]
  }
  const media = group.filter((option) => option.specs_json?.media_bay)
  const orderedMedia = media.sort((a, b) => {
    const aText = optionSearchText(a)
    const bText = optionSearchText(b)
    const score = (text: string) => text.includes("sas/sata") ? 1 : text.includes("nvme") ? 2 : text.includes("uff") || text.includes("m.2") ? 3 : 4
    return score(aText) - score(bText)
  })
  return [base, ...orderedMedia].filter(Boolean) as ComponentOption[]
}

function preferredOptionForGroup(groupKey: string, group: ComponentOption[], model: ServerModel) {
  if (!group.length) return undefined
  const chassisText = modelSearchText(model)
  const find = (...needles: string[]) => group.find((option) => {
    const text = optionSearchText(option)
    return needles.every((needle) => text.includes(needle))
  })

  if (groupKey === "drive_bay") {
    if (isTenSffPremium(model)) {
      return find("10sff", "premium") || find("nvme") || group[0]
    }
    if (chassisText.includes("front") || chassisText.includes("media")) {
      return group.find((option) => option.specs_json?.media_bay) || group[0]
    }
    return preferredBaseBackplane(group, model) || group[0]
  }

  if (groupKey === "cooling") {
    const needsPerformance = model.cooling_profile.toLowerCase().includes("performance") || chassisText.includes("10sff") || chassisText.includes("nvme")
    const performance = group.find((option) => /performance|high/i.test(optionSearchText(option)))
    const standard = group.find((option) => !/performance|high/i.test(optionSearchText(option)))
    return needsPerformance ? performance || group[0] : standard || group[0]
  }

  if (groupKey === "riser" && (chassisText.includes("10sff") || chassisText.includes("nvme"))) {
    return group.find((option) => !optionSearchText(option).includes("low profile")) || group[0]
  }

  if (groupKey === "raid" && model.supported_drive_interfaces.includes("NVMe")) {
    return find("nvme") || group[0]
  }

  return group[0]
}

function driveBayLine(option: ComponentOption, model: ServerModel) {
  const specs = option.specs_json || {}
  const interfaces = specs.interfaces?.join?.("/") || specs.interface
  if (!specs.media_bay) {
    if (isTenSffPremium(model)) {
      return "10SFF NVMe Premium · integrated front cage/backplane · SAS/SATA/NVMe"
    }
    if (isFourLff(model)) {
      return "4LFF base backplane · SAS/SATA · без Media Bay"
    }
    const bayCount = model.slug.includes("4lff") ? "4LFF" : "8SFF"
    return `${bayCount} base backplane · SAS/SATA · без Media Bay`
  }
  const text = optionSearchText(option)
  if (text.includes("nvme")) return `Media Bay · +2 SFF NVMe · ${option.public_name}`
  if (text.includes("uff") || text.includes("m.2")) return `Media Bay · Dual uFF M.2 · ${option.public_name}`
  if (text.includes("display") || text.includes("optical") || text.includes("usb")) return `Media Bay · DisplayPort/USB/Optical blank · ${option.public_name}`
  return `Media Bay · +2 SFF SAS/SATA · ${option.public_name}${interfaces ? ` · ${interfaces}` : ""}`
}

function storageLimitsForDriveBay(model: ServerModel, driveBay?: ComponentOption) {
  const specs = driveBay?.specs_json || {}
  const bayText = driveBay ? optionSearchText(driveBay) : String(model.backplane_type || "").toLowerCase()
  const interfaces = (specs.interfaces || (specs.interface ? [specs.interface] : model.supported_drive_interfaces || []))
    .map((item: string) => String(item).toLowerCase())
  const baseBayCount = Number(model.drive_bays_front || 0)
  const providedBays = Number(
    specs.bay_count ||
    specs.added_bay_count ||
    specs.provides?.driveBays ||
    specs.provides?.devices ||
    0
  )
  const effectiveBayCount = Number(specs.effective_bay_count || 0)
  const mediaBay = Boolean(specs.media_bay || specs.logical_group === "media_bay")
  const normalizedType = String(specs.normalized_type || "").toLowerCase()

  if (mediaBay) {
    if (interfaces.includes("nvme") || bayText.includes("nvme")) {
      return { sasSata: baseBayCount, nvme: providedBays || 2, m2: 0 }
    }
    if (normalizedType.includes("m2") || bayText.includes("uff") || bayText.includes("m.2")) {
      return { sasSata: baseBayCount, nvme: 0, m2: providedBays || 4 }
    }
    if (interfaces.includes("sas") || interfaces.includes("sata") || bayText.includes("sas/sata")) {
      return { sasSata: effectiveBayCount || baseBayCount + providedBays, nvme: 0, m2: 0 }
    }
    return { sasSata: baseBayCount, nvme: 0, m2: 0 }
  }

  const bayCount = providedBays || effectiveBayCount || baseBayCount
  return {
    sasSata: interfaces.includes("sas") || interfaces.includes("sata") || bayText.includes("sas") || bayText.includes("sata") ? bayCount : 0,
    nvme: interfaces.includes("nvme") || bayText.includes("nvme") ? bayCount : 0,
    m2: normalizedType.includes("m2") || bayText.includes("m.2") || bayText.includes("uff") ? bayCount : 0,
  }
}

function driveMaxQuantity(option: ComponentOption, model: ServerModel, driveBay?: ComponentOption) {
  const limits = storageLimitsForDriveBay(model, driveBay)
  const text = optionSearchText(option)
  const iface = optionStorageInterface(option)
  if (text.includes("m.2") || text.includes("uff")) return limits.m2
  if (iface === "nvme") return limits.nvme
  if (iface === "sas" || iface === "sata") return limits.sasSata
  return 0
}

function driveCompatibleWithBay(option: ComponentOption, model: ServerModel, driveBay?: ComponentOption) {
  const iface = optionStorageInterface(option)
  if (isFourLff(model)) {
    return ["sas", "sata"].includes(iface) && ["3.5", "2.5"].includes(String(option.specs_json?.form_factor || ""))
  }
  return driveMaxQuantity(option, model, driveBay) > 0
}

function normalizeDriveSelection(selection: Selection, options: ComponentOption[], model: ServerModel) {
  const driveBay = selection.drive_bay?.option
  const drives = groupOptions(options, "drive").filter((option) => driveCompatibleWithBay(option, model, driveBay))
  if (!drives.length) return selection
  const current = selection.drive
  const option = current && drives.some((item) => item.id === current.option.id)
    ? current.option
    : drives[0]
  const maxQty = driveMaxQuantity(option, model, driveBay)
  return {
    ...selection,
    drive: {
      option,
      quantity: Math.min(Math.max(1, current?.quantity || 1), Math.max(1, maxQty)),
    },
  }
}

function optionHint(option: ComponentOption, model: ServerModel) {
  const specs = option.specs_json || {}
  const text = optionSearchText(option)
  if (option.type === "backplane" && !specs.media_bay) {
    if (isTenSffPremium(model)) {
      return "Для 10SFF NVMe Premium корзина является частью отдельного chassis/storage варианта: front cage и backplane уже заданы, Media Bay отдельно не выбирается."
    }
    if (isFourLff(model)) {
      return "Для 4LFF используется базовая LFF SAS/SATA корзина без Media Bay. 2.5-inch SAS/SATA SSD можно подбирать в Storage через LFF/SFF adapter path."
    }
    return "Стандартная корзина текущей карточки: 8 SFF SAS/SATA без переднего Media Bay. Это базовый вариант для 8SFF товара."
  }
  if (option.type === "backplane" && specs.media_bay) {
    if (text.includes("nvme")) return "Добавляет два передних NVMe SFF отсека. Использовать только с NVMe накопителями и совместимым кабельным/PCIe путем."
    if (text.includes("uff") || text.includes("m.2")) return "Добавляет Dual uFF/M.2 носители для загрузочных или сервисных SSD, не заменяет основную 8SFF корзину."
    if (text.includes("display") || text.includes("optical") || text.includes("usb")) return "Front option под DisplayPort/USB/Optical blank. Не добавляет дисковые отсеки."
    return "Добавляет два передних SFF SAS/SATA отсека к базовой 8SFF корзине."
  }
  if (option.type === "raid") return "Проверьте интерфейс, кэш и BBU: контроллер должен соответствовать выбранному типу накопителей и backplane."
  if (option.type === "riser") {
    const text = optionSearchText(option)
    if (text.includes("low profile")) return "Low Profile riser дает низкопрофильные PCIe-слоты для сетевых карт, HBA/RAID и других адаптеров в 1U корпусе."
    if (text.includes("m.2")) return "M.2 riser используется для загрузочных SATA M.2 SSD и занимает отдельный riser path; проверяйте совместимость с PCIe адаптерами."
    return "Riser добавляет PCIe-путь для адаптеров. Тип riser определяет высоту карты, доступные слоты и совместимость с сетевыми/RAID опциями."
  }
  return ""
}

function quantityEnabledForGroup(groupKey: string) {
  return ["cpu", "drive", "nic", "psu", "ram"].includes(groupKey)
}

function selectedValues(selection: Selection, multiSelection: MultiSelection) {
  return [
    ...Object.entries(selection)
      .filter(([key, item]) => key !== "nic" && Boolean(item))
      .map(([, item]) => item as { option: ComponentOption; quantity: number }),
    ...Object.values(multiSelection.nic || {}),
  ]
}

function coolingForCpu(cpu: ComponentOption, coolingOptions: ComponentOption[]) {
  const cpuTdp = Number(cpu.specs_json?.tdp || 0)
  const needsPerformance = cpuTdp >= 150
  const performance = coolingOptions.find((option) => /performance|high/i.test(optionSearchText(option)))
  const standard = coolingOptions.find((option) => !/performance|high/i.test(optionSearchText(option)))
  return needsPerformance ? performance || standard || coolingOptions[0] : standard || performance || coolingOptions[0]
}

function nicTotal(multiSelection: MultiSelection) {
  return Object.values(multiSelection.nic || {}).reduce((sum, item) => sum + item.quantity, 0)
}

const maxNetworkAdapters = 3

function nicSlotLimit(option: ComponentOption) {
  const slot = optionNetworkSlot(option)
  if (slot === "flexlom" || slot === "embedded" || slot === "ocp") return 1
  if (slot === "pcie") return 2
  return 1
}

function nicSlotTotal(multiSelection: MultiSelection, slot: string, exceptId?: string) {
  return Object.entries(multiSelection.nic || {})
    .filter(([id]) => id !== exceptId)
    .filter(([, item]) => optionNetworkSlot(item.option) === slot)
    .reduce((sum, [, item]) => sum + item.quantity, 0)
}

export function ConfiguratorClient({
  annotations = [],
  model,
  options,
}: {
  annotations?: HelpAnnotation[]
  model: ServerModel
  navModels?: ServerModel[]
  options: ComponentOption[]
}) {
  const defaults = useMemo(() => {
    const next: Selection = {}
    for (const group of configuratorGroups) {
      const groupItems = groupOptions(options, group.key)
      const option = preferredOptionForGroup(group.key, groupItems, model)
      if (option) next[group.key] = { option, quantity: group.key === "ram" ? 2 : 1 }
    }
    return normalizeDriveSelection(next, options, model)
  }, [model, options])
  const [selection, setSelection] = useState<Selection>(() => {
    const next = { ...defaults }
    delete next.nic
    return next
  })
  const [multiSelection, setMultiSelection] = useState<MultiSelection>(() => (
    defaults.nic ? { nic: { [defaults.nic.option.id]: defaults.nic } } : { nic: {} }
  ))
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [storageFilters, setStorageFilters] = useState<StorageFilters>({ kind: "all", interface: "all" })
  const [raidFilters, setRaidFilters] = useState<RaidFilters>({ kind: "all", cache: "all", interface: "all" })
  const [validation, setValidation] = useState<any>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const selectedItems = selectedValues(selection, multiSelection)
  const localTotal = selectedItems.reduce((sum, item) => sum + item.option.price * item.quantity, 0)

  async function validate(nextSelection = selection, nextMultiSelection = multiSelection) {
    setPending(true)
    const selected_components = selectedValues(nextSelection, nextMultiSelection)
      .map((item) => ({ component_id: item.option.id, quantity: item.quantity }))
    try {
      const result = await sdk.client.fetch("/store/server-configurator/validate", {
        method: "POST",
        body: { server_model_slug: model.slug, selected_components },
      })
      setValidation(result)
    } catch {
      setValidation({
        valid: false,
        errors: ["Не удалось получить результат backend Rules Engine."],
        warnings: [],
        total_price: localTotal,
        effective_specs: {},
      })
    } finally {
      setPending(false)
    }
  }

  async function addCurrentConfigurationToCart() {
    setPending(true)
    setCartMessage(null)
    const selected_components = selectedItems
      .map((item) => ({ component_id: item.option.id, quantity: item.quantity, type: item.option.type }))
    const result = await addConfiguredServerToCart({
      server_model_slug: model.slug,
      selected_components,
      quantity: 1,
      pricing_mode: "request_quote",
    })
    setValidation({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      effective_specs: result.effective_specs,
      total_price: (result.line_item?.metadata as any)?.total_price ?? total,
    })
    if (result.valid) {
      window.dispatchEvent(new Event(SERVER_CART_UPDATED_EVENT))
    }
    setCartMessage(result.valid ? "Конфигурация добавлена в Medusa cart." : result.errors.join(" "))
    setPending(false)
  }

  function choose(type: string, option: ComponentOption) {
    if (type === "nic") {
      const currentGroup = multiSelection.nic || {}
      const nextGroup = { ...currentGroup }
      if (nextGroup[option.id]) {
        delete nextGroup[option.id]
      } else {
        const slot = optionNetworkSlot(option)
        const slotLimit = nicSlotLimit(option)
        const slotQty = nicSlotTotal(multiSelection, slot)
        if (nicTotal(multiSelection) < maxNetworkAdapters && slotQty < slotLimit) {
          nextGroup[option.id] = { option, quantity: 1 }
        }
      }
      const nextMulti = { ...multiSelection, nic: nextGroup }
      setMultiSelection(nextMulti)
      validate(selection, nextMulti)
      return
    }

    let next = { ...selection, [type]: { option, quantity: selection[type]?.quantity || 1 } }
    if (type === "cpu" && next.ram) {
      const cpuLimit = optionMemorySpeed(option)
      const ramSpeed = optionMemorySpeed(next.ram.option)
      if (cpuLimit && ramSpeed && ramSpeed > cpuLimit) {
        const replacementRam = filterOptions("ram", groupOptions(options, "ram"), "all", option)[0]
        if (replacementRam) next.ram = { option: replacementRam, quantity: next.ram.quantity }
      }
      const cooling = coolingForCpu(option, groupOptions(options, "cooling"))
      if (cooling) next.cooling = { option: cooling, quantity: 1 }
    }
    if (type === "drive_bay") {
      next = normalizeDriveSelection(next, options, model)
    }
    if (type === "drive") {
      next.drive = {
        option,
        quantity: Math.min(selection.drive?.quantity || 1, Math.max(1, driveMaxQuantity(option, model, selection.drive_bay?.option))),
      }
    }
    setSelection(next)
    validate(next, multiSelection)
  }

  function setQuantity(type: string, quantity: number) {
    if (type === "nic") return
    const current = selection[type]
    if (!current) return
    const maxQty = type === "drive"
      ? driveMaxQuantity(current.option, model, selection.drive_bay?.option)
      : Number.POSITIVE_INFINITY
    const next = { ...selection, [type]: { ...current, quantity: Math.min(Math.max(1, quantity), Math.max(1, maxQty)) } }
    setSelection(next)
    validate(next, multiSelection)
  }

  function setNicQuantity(option: ComponentOption, quantity: number) {
    const currentGroup = multiSelection.nic || {}
    const current = currentGroup[option.id]
    if (!current) return
    const otherQty = Object.entries(currentGroup)
      .filter(([id]) => id !== option.id)
      .reduce((sum, [, item]) => sum + item.quantity, 0)
    const slot = optionNetworkSlot(option)
    const slotOtherQty = nicSlotTotal(multiSelection, slot, option.id)
    const slotLimit = nicSlotLimit(option)
    const cappedQty = Math.min(
      Math.max(1, quantity),
      Math.max(1, maxNetworkAdapters - otherQty),
      Math.max(1, slotLimit - slotOtherQty)
    )
    const nextMulti = {
      ...multiSelection,
      nic: { ...currentGroup, [option.id]: { ...current, quantity: cappedQty } },
    }
    setMultiSelection(nextMulti)
    validate(selection, nextMulti)
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLDivElement>, type: string, option: ComponentOption) {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    choose(type, option)
  }

  const total = validation?.total_price ?? localTotal
  const valid = validation?.valid !== false
  const annotationFor = (componentType: string, targetType = "group") => {
    return annotations.find((item) => item.component_type === componentType && item.target_type === targetType)
  }
  const summaryAnnotation = annotationFor("summary", "summary")

  return (
    <div className="server-configurator-stack">
      <div className="server-configurator-title server-configurator-title-top">
        <span>Конфигуратор сервера</span>
        <h1>{model.public_name}</h1>
      </div>

      <ConfiguratorOverview
        model={model}
        pending={pending}
        selectedItems={selectedItems}
        total={total}
        valid={valid}
        onRequestQuote={() => validate()}
      />

      <div className="server-configurator-layout">
        <section className="server-configurator-main">
          {configuratorGroups.map((group) => {
            const rawBaseOptionsForGroup = groupOptions(options, group.key)
            const baseOptionsForGroup = group.key === "drive_bay"
              ? driveBayDisplayOptions(rawBaseOptionsForGroup, model)
              : group.key === "drive"
                ? rawBaseOptionsForGroup.filter((option) => driveCompatibleWithBay(option, model, selection.drive_bay?.option))
                : rawBaseOptionsForGroup
            const cpuOption = selection.cpu?.option
            const optionsForControls = group.key === "ram"
              ? filterOptions(group.key, baseOptionsForGroup, "all", cpuOption)
              : baseOptionsForGroup
            const controls = filterControls(group.key, optionsForControls)
            const requestedFilter = activeFilters[group.key] || "all"
            const activeFilter = requestedFilter === "all" || controls.some((filter) => filter.id === requestedFilter && !filter.disabled)
              ? requestedFilter
              : "all"
            const optionsForGroup = group.key === "drive"
              ? filterDriveOptions(baseOptionsForGroup, storageFilters)
              : group.key === "raid"
                ? filterRaidOptions(baseOptionsForGroup, raidFilters)
                : filterOptions(group.key, baseOptionsForGroup, activeFilter, cpuOption)
            if (!optionsForGroup.length) return null
            return (
              <section className="server-configurator-group" key={group.key}>
                <div className="group-title">
                  <SlidersHorizontal size={20} />
                  <div>
                    <h2>{group.label}</h2>
                  </div>
                  <HelpPopover annotation={annotationFor(group.annotationType)} />
                </div>
                {group.key === "drive" && (
                  <div className="storage-filter-panel" aria-label="Фильтр накопителей">
                    <div>
                      <span>Тип накопителя:</span>
                      {[
                        ["all", "Все"],
                        ["hdd", "HDD"],
                        ["ssd", "SSD"],
                      ].map(([id, label]) => (
                        <button
                          className={storageFilters.kind === id ? "active" : ""}
                          disabled={id !== "all" && !baseOptionsForGroup.some((option) => optionDriveKind(option) === id)}
                          key={id}
                          type="button"
                          onClick={() => setStorageFilters((current) => ({ ...current, kind: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <span>Интерфейс:</span>
                      {[
                        ["all", "Все"],
                        ["sata", "SATA"],
                        ["sas", "SAS"],
                        ["nvme", "NVMe"],
                      ].map(([id, label]) => (
                        <button
                          className={storageFilters.interface === id ? "active" : ""}
                          disabled={id !== "all" && !baseOptionsForGroup.some((option) => optionStorageInterface(option) === id)}
                          key={id}
                          type="button"
                          onClick={() => setStorageFilters((current) => ({ ...current, interface: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {group.key === "raid" && (
                  <div className="storage-filter-panel raid-filter-panel" aria-label="Фильтр RAID контроллеров">
                    <div>
                      <span>Тип контроллера:</span>
                      {[
                        ["all", "Все"],
                        ["smart-array", "Smart Array"],
                        ["megaraid", "MegaRAID"],
                        ["hba", "HBA"],
                      ].filter(([id]) => id === "all" || baseOptionsForGroup.some((option) => optionRaidControllerKind(option) === id)).map(([id, label]) => (
                        <button
                          className={raidFilters.kind === id ? "active" : ""}
                          key={id}
                          type="button"
                          onClick={() => setRaidFilters((current) => ({ ...current, kind: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <span>Интерфейс:</span>
                      {[
                        ["all", "Все"],
                        ["sas", "SAS/SATA"],
                        ["nvme", "NVMe"],
                      ].filter(([id]) => id === "all" || baseOptionsForGroup.some((option) => (optionStorageInterface(option) || "sas") === id)).map(([id, label]) => (
                        <button
                          className={raidFilters.interface === id ? "active" : ""}
                          key={id}
                          type="button"
                          onClick={() => setRaidFilters((current) => ({ ...current, interface: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div>
                      <span>Кэш:</span>
                      {[
                        ["all", "Все"],
                        ["none", "Без кэша"],
                        ["cache", "Cache"],
                        ["bbu", "Cache + BBU"],
                      ].filter(([id]) => id === "all" || baseOptionsForGroup.some((option) => optionRaidCache(option) === id)).map(([id, label]) => (
                        <button
                          className={raidFilters.cache === id ? "active" : ""}
                          key={id}
                          type="button"
                          onClick={() => setRaidFilters((current) => ({ ...current, cache: id }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {group.key !== "drive" && group.key !== "raid" && controls.length > 1 && (
                  <div className="server-config-filter-switches" aria-label={`${group.label} filters`}>
                    <button
                      className={activeFilter === "all" ? "selected" : ""}
                      type="button"
                      onClick={() => setActiveFilters((current) => ({ ...current, [group.key]: "all" }))}
                    >
                      Все
                    </button>
                    {controls.map((filter) => (
                      <button
                        className={activeFilter === filter.id ? "selected" : ""}
                        disabled={filter.disabled}
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilters((current) => ({ ...current, [group.key]: filter.id }))}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="server-option-list">
                  {optionsForGroup.map((option) => {
                    const multiItem = group.key === "nic" ? multiSelection.nic?.[option.id] : undefined
                    const singleItem = selection[group.key]
                    const selected = group.key === "nic" ? Boolean(multiItem) : singleItem?.option.id === option.id
                    const hint = optionHint(option, model)
                    const hasQuantity = quantityEnabledForGroup(group.key)
                    const itemQuantity = group.key === "nic" ? multiItem?.quantity : singleItem?.quantity
                    return (
                      <div
                        aria-pressed={selected}
                        className={`server-option-row ${selected ? "selected" : ""}`}
                        onClick={() => choose(group.key, option)}
                        onKeyDown={(event) => handleOptionKeyDown(event, group.key, option)}
                        role="button"
                        tabIndex={0}
                        key={option.id}
                      >
                        <span className="server-radio-dot">{selected ? "✓" : ""}</span>
                        <strong>{group.key === "drive_bay" ? driveBayLine(option, model) : optionLine(option)}</strong>
                        {hint && (
                          <span className="server-option-info" aria-label={hint}>
                            i
                            <span role="tooltip">{hint}</span>
                          </span>
                        )}
                        <span className="server-option-price">+ {formatPrice(option.price)}</span>
                        {selected && hasQuantity && (
                          <span
                            className="server-quantity"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <button type="button" onClick={() => group.key === "nic" ? setNicQuantity(option, (itemQuantity || 1) - 1) : setQuantity(group.key, (itemQuantity || 1) - 1)}>-</button>
                            <b>{itemQuantity || 1}</b>
                            <button type="button" onClick={() => group.key === "nic" ? setNicQuantity(option, (itemQuantity || 1) + 1) : setQuantity(group.key, (itemQuantity || 1) + 1)}>+</button>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </section>

        <ConfiguratorSummaryPanel
          model={model}
          pending={pending}
          selectedItems={selectedItems}
          summaryAnnotation={summaryAnnotation}
          total={total}
          validation={validation}
          valid={valid}
          onValidate={() => validate()}
          onAddToCart={addCurrentConfigurationToCart}
        />
      </div>
      {cartMessage && <div className="server-cart-toast" role="status">{cartMessage}</div>}
    </div>
  )
}
