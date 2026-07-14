import { Checkbox } from "@medusajs/ui"
import { Field, RawPreview } from "../_shared/form"
import { joinList, numberValue, splitList } from "../_shared/api"

const fieldsByType: Record<string, string[]> = {
  cpu: ["generation", "socket", "cores", "threads", "base_clock", "tdp", "max_memory_speed"],
  ram: ["capacity_gb", "type", "speed", "rank", "ecc"],
  drive: ["capacity", "interface", "form_factor", "drive_kind", "u2_nvme"],
  raid: ["vendor", "controller_family", "placement", "supported_interfaces", "cache", "battery", "requires_cable", "requires_riser", "vendor_platform"],
  nic: ["vendor", "ports", "speed", "connector", "slot_type", "height", "max_quantity", "vendor_platform"],
  psu: ["wattage", "efficiency", "hot_plug", "redundant_capable"],
  riser: ["slots", "height", "width", "cpu_dependency"],
  cooling: ["cooling_tier", "max_cpu_tdp", "min_cpu_tdp", "recommended_for"],
  backplane: ["logical_group", "media_bay", "backplane_role", "bay_count", "effective_bay_count", "interfaces", "form_factor", "supported_drive_kind", "requires_components"],
}

const boolKeys = new Set(["ecc", "u2_nvme", "requires_cable", "requires_riser", "hot_plug", "redundant_capable", "media_bay"])
const numberKeys = new Set(["cores", "threads", "tdp", "max_memory_speed", "capacity_gb", "ports", "max_quantity", "wattage", "max_cpu_tdp", "min_cpu_tdp", "bay_count", "effective_bay_count"])
const listKeys = new Set(["supported_interfaces", "interfaces", "supported_drive_kind", "requires_components", "recommended_for", "slots"])

export function SpecsEditor({
  type,
  value,
  onChange,
}: {
  type: string
  value: Record<string, any>
  onChange: (value: Record<string, any>) => void
}) {
  const keys = fieldsByType[type] || []
  const set = (key: string, next: any) => onChange({ ...value, [key]: next })

  return (
    <div className="flex flex-col gap-y-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {keys.map((key) => {
          if (boolKeys.has(key)) {
            return (
              <label key={key} className="flex items-center gap-x-2">
                <Checkbox checked={Boolean(value[key])} onCheckedChange={(checked) => set(key, checked === true)} />
                {key}
              </label>
            )
          }
          return (
            <Field
              key={key}
              type={numberKeys.has(key) ? "number" : "text"}
              label={key}
              value={listKeys.has(key) ? joinList(value[key]) : value[key] || ""}
              onChange={(next) => {
                if (listKeys.has(key)) return set(key, splitList(next))
                if (numberKeys.has(key)) return set(key, numberValue(next))
                set(key, next)
              }}
            />
          )
        })}
      </div>
      <RawPreview value={value} />
    </div>
  )
}
