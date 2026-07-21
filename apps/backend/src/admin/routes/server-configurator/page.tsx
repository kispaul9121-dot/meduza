import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ServerStack } from "@medusajs/icons";
import { Badge, Container, Heading, Text } from "@medusajs/ui";
import { Link } from "react-router-dom";

const sections = [
  [
    "publishing-assistant",
    "Publishing Assistant",
    "Deterministic publication gate, structured findings and guided repair sessions",
  ],
  [
    "ready-configurations",
    "Ready Configurations",
    "Immutable published presets, validation versions, stale detection and storefront preview",
  ],
  [
    "genius-bootstrap",
    "Genius Bootstrap",
    "Discovery, dependency planning, three modes and confirmed creation manifests",
  ],
  [
    "server-wizard",
    "Server Wizard",
    "Controlled 14-step server creation, simulation and publication",
  ],
  [
    "coverage-impact",
    "Coverage & Impact",
    "Unmapped knowledge, validator gaps and revalidation impact",
  ],
  [
    "knowledge-base",
    "Knowledge Base",
    "Canonical properties, concepts, relationships, platforms and coverage",
  ],
  [
    "smart-builder",
    "Smart Builder",
    "Create components, packs, bundles and storage topology with live validation",
  ],
  [
    "option-groups",
    "Option Groups",
    "Configure candidate sources, cardinality and real none states",
  ],
  [
    "models",
    "Server Models",
    "Create, link and publish server chassis variants",
  ],
  [
    "components",
    "Components",
    "Manage CPU, RAM, drive, RAID, NIC, PSU and kits",
  ],
  [
    "component-packs",
    "Component Packs",
    "Bulk group components and apply storefront applicability",
  ],
  [
    "applicability",
    "Applicability",
    "Preview component availability by brand/family/model/chassis",
  ],
  ["rules", "Rules", "Build and review compatibility rules"],
  [
    "rule-presets",
    "Rule Presets",
    "Create rules from reusable compatibility templates",
  ],
  ["help-annotations", "Help Annotations", "Manage practical help popovers"],
  [
    "simulator",
    "Rule Simulator",
    "Check configurations against the backend Rules Engine",
  ],
  [
    "source-of-truth",
    "Source of Truth",
    "Audit DB ownership and runtime fallback status",
  ],
  [
    "import-pipeline",
    "Technical Import Pipeline",
    "Vendor adapters, raw and normalized review, dry-run, transactional apply and rollback",
  ],
  [
    "import-review",
    "Import Review",
    "Review imported Payloud data before publishing",
  ],
];

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
            <Text size="small" weight="plus">
              {title}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {description}
            </Text>
          </div>
          <Badge color="blue">Open</Badge>
        </Link>
      ))}
    </Container>
  </div>
);

export const config = defineRouteConfig({
  label: "Server Configurator",
  icon: ServerStack,
});

export default ServerConfiguratorPage;
