import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ServerStack } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

const sections = [
  ["models", "Server Models", "Create, link and publish server chassis variants"],
  ["components", "Components", "Manage CPU, RAM, drive, RAID, NIC, PSU and kits"],
  ["component-packs", "Component Packs", "Bulk group components and apply storefront applicability"],
  ["applicability", "Applicability", "Preview component availability by brand/family/model/chassis"],
  ["rules", "Rules", "Build and review compatibility rules"],
  ["rule-presets", "Rule Presets", "Create rules from reusable compatibility templates"],
  ["help-annotations", "Help Annotations", "Manage practical help popovers"],
  ["simulator", "Rule Simulator", "Check configurations against the backend Rules Engine"],
  ["source-of-truth", "Source of Truth", "Audit DB ownership and runtime fallback status"],
  ["import-review", "Import Review", "Review imported Payloud data before publishing"],
]

const ServerConfiguratorPage = () => (
  <div className="flex flex-col gap-y-4">
    <div>
      <Heading>Server Configurator</Heading>
      <Text className="text-ui-fg-subtle">
        Backend-driven server configurator data, rules and admin workflows.
      </Text>
    </div>
    <Container className="divide-y p-0">
      {sections.map(([path, title, description]) => (
        <Link
          key={path}
          to={`/server-configurator/${path}`}
          className="flex items-center justify-between px-6 py-4 outline-none hover:bg-ui-bg-subtle"
        >
          <div>
            <Text size="small" weight="plus">{title}</Text>
            <Text size="small" className="text-ui-fg-subtle">{description}</Text>
          </div>
          <Badge color="blue">Open</Badge>
        </Link>
      ))}
    </Container>
  </div>
)

export const config = defineRouteConfig({
  label: "Server Configurator",
  icon: ServerStack,
})

export default ServerConfiguratorPage
