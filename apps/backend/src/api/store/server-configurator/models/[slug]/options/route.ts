import { MedusaError } from "@medusajs/framework/utils"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SERVER_CONFIGURATOR_MODULE } from "../../../../../../modules/server-configurator"
import {
  getDevFallbackComponents,
  shouldUseDevConfiguratorFallback,
} from "../../../../../../modules/server-configurator/runtime-fallback-warning"
import { componentAppliesToModel } from "../../../../../../modules/server-configurator/applicability"

function textFor(component: any) {
  return [
    component.public_name,
    component.short_name,
    component.model,
    component.brand,
    component.specs_json?.interface,
    component.specs_json?.interfaces?.join?.(" "),
    component.specs_json?.slot_type,
    component.specs_json?.connector,
    component.specs_json?.vendor,
    component.specs_json?.backplane_role,
    component.specs_json?.logical_group,
  ].filter(Boolean).join(" ").toLowerCase()
}

function normalizeBackplane(component: any, model: any) {
  if (component.type !== "backplane") return component

  const specs = component.specs_json || {}
  const isMediaBay = Boolean(specs.media_bay || specs.logical_group === "media_bay")
  const interfaces = specs.interfaces || (specs.interface ? [specs.interface] : [])
  const providedBays = Number(
    specs.bay_count ||
    specs.added_bay_count ||
    specs.provides?.driveBays ||
    specs.provides?.devices ||
    0
  )
  const baseBays = Number(model.drive_bays_front || 0)
  const role = specs.backplane_role || (isMediaBay ? "media_bay" : "base")
  const effectiveBayCount = isMediaBay && role === "media_bay"
    ? baseBays + providedBays
    : providedBays || baseBays

  return {
    ...component,
    specs_json: {
      ...specs,
      interfaces,
      logical_group: isMediaBay ? "media_bay" : "backplane",
      media_bay: isMediaBay,
      backplane_role: role,
      bay_count: providedBays || specs.bay_count || baseBays,
      effective_bay_count: effectiveBayCount,
    },
  }
}

function is10SffPremium(model: any) {
  return [model.slug, model.chassis_type, model.backplane_type, model.front_option_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .match(/10sff|premium/)
}

function is4Lff(model: any) {
  return [model.slug, model.chassis_type, model.backplane_type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("4lff")
}

function selectBaseBackplane(backplanes: any[], model: any) {
  if (is10SffPremium(model)) {
    return backplanes.find((component) => textFor(component).includes("10sff") && textFor(component).includes("premium"))
      || backplanes.find((component) => textFor(component).includes("hybrid") && textFor(component).includes("nvme"))
      || backplanes.find((component) => textFor(component).includes("nvme") && !textFor(component).includes("rear"))
      || backplanes[0]
  }

  if (is4Lff(model)) {
    return backplanes.find((component) => textFor(component).includes("4lff"))
      || backplanes.find((component) => textFor(component).includes("lff"))
      || backplanes.find((component) => textFor(component).includes("sas/sata") && !textFor(component).includes("nvme") && !textFor(component).includes("rear"))
      || backplanes.find((component) => !textFor(component).includes("nvme") && !textFor(component).includes("rear"))
      || backplanes[0]
  }

  return backplanes.find((component) => textFor(component).includes("8sff") && textFor(component).includes("sas") && !textFor(component).includes("nvme"))
    || backplanes.find((component) => textFor(component).includes("sas/sata") && !textFor(component).includes("nvme") && !textFor(component).includes("rear"))
    || backplanes.find((component) => !textFor(component).includes("nvme") && !textFor(component).includes("rear"))
    || backplanes[0]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve(SERVER_CONFIGURATOR_MODULE) as any
  const [model] = await service.listServerModels({ slug: req.params.slug, enabled: true })

  if (!model) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Server model not found")
  }

  const components = await service.listComponents({ enabled: true }, {
    order: { type: "ASC", public_name: "ASC" },
  })
  const sourceComponents = shouldUseDevConfiguratorFallback(components)
    ? getDevFallbackComponents()
    : components
  const normalizedComponents = sourceComponents
    .filter((component: any) => componentAppliesToModel(component, model))
    .map((component: any) => normalizeBackplane(component, model))
  const baseBackplanes = normalizedComponents.filter((component: any) => component.type === "backplane" && component.specs_json?.logical_group !== "media_bay")
  const preferredBackplane = selectBaseBackplane(baseBackplanes, model)
  const options = normalizedComponents.filter((component: any) => {
    if (component.type === "backplane" && component.specs_json?.logical_group === "media_bay") {
      return !is10SffPremium(model) && !is4Lff(model)
    }
    if (component.type === "backplane" && component.specs_json?.logical_group !== "media_bay") {
      return preferredBackplane ? component.id === preferredBackplane.id : !component.specs_json?.media_bay
    }
    if (component.type === "raid") {
      const text = textFor(component)
      if (text.includes("placeholder") || text.includes("generic") || text.includes("12g sas raid") || text.includes("megaraid") || text.includes("hba")) {
        return false
      }
      return component.brand === "HPE" && (
        text.includes("smart array s100i") ||
        text.includes("smart array e208i-a") ||
        text.includes("smart array p408i-a") ||
        text.includes("smart array p816i-a")
      )
    }
    if (component.type === "nic") {
      const text = textFor(component)
      const brand = String(component.brand || "").toLowerCase()
      const documentedIntel = brand === "intel" && (
        text.includes("i350") ||
        text.includes("x710") ||
        text.includes("ethernet i350") ||
        text.includes("ethernet x710")
      )
      const documentedBroadcom = brand === "broadcom" && (
        text.includes("631") ||
        text.includes("bcm57414") ||
        text.includes("57414")
      )
      if (text.includes("generic") || text.includes("generic nic")) return false
      if (!documentedIntel && !documentedBroadcom) return false
      return Boolean(component.specs_json?.slot_type)
    }
    if (component.type !== "drive") return true
    const driveFormFactor = component.specs_json?.form_factor
    const driveInterface = component.specs_json?.interface
    const supportedInterface = (model.supported_drive_interfaces || []).includes(driveInterface)
    const mediaBayCanExposeNvme = !is4Lff(model) && driveFormFactor === "2.5" && driveInterface === "NVMe"
    if (!supportedInterface && !mediaBayCanExposeNvme) return false
    if (driveFormFactor === model.drive_form_factor) return true
    return is4Lff(model) && driveFormFactor === "2.5" && ["SAS", "SATA"].includes(driveInterface)
  })
  const groups = [
    {
      key: "backplane",
      label: "Backplane",
      options: options.filter((component: any) => component.type === "backplane" && component.specs_json?.logical_group !== "media_bay"),
    },
    {
      key: "media_bay",
      label: "Media Bay",
      options: options.filter((component: any) => component.type === "backplane" && component.specs_json?.logical_group === "media_bay"),
    },
  ]

  res.json({
    model,
    options,
    groups,
    source: shouldUseDevConfiguratorFallback(components) ? "dev_fallback" : "db",
  })
}
