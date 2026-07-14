import { Button, Heading, Text } from "@medusajs/ui"
import { useState } from "react"
import { AnnotationsTable } from "./annotations-table"
import { ComponentsTable } from "./components-table"
import { DraftRulesTable } from "./draft-rules-table"
import { LegacyLogicPanel } from "./legacy-logic-panel"
import { PresetsTable } from "./presets-table"
import { UiStyleReviewPanel } from "./ui-style-review-panel"

const tabs = ["Components", "Help Annotations", "Draft Rules", "Rule Presets", "Legacy Logic", "UI Style Review"] as const

export function ImportReviewTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Components")

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading>Import Review</Heading>
        <Text className="text-ui-fg-subtle">Payloud 2 import control, legacy configurator audit and UI compactness review.</Text>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button size="small" variant={active === tab ? "primary" : "secondary"} key={tab} onClick={() => setActive(tab)}>
            {tab}
          </Button>
        ))}
      </div>
      {active === "Components" && <ComponentsTable />}
      {active === "Help Annotations" && <AnnotationsTable />}
      {active === "Draft Rules" && <DraftRulesTable />}
      {active === "Rule Presets" && <PresetsTable />}
      {active === "Legacy Logic" && <LegacyLogicPanel />}
      {active === "UI Style Review" && <UiStyleReviewPanel />}
    </div>
  )
}
