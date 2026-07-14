export type LegacyUiStyleFinding = {
  area: string
  payloud: string
  medusa_current: string
  recommendation: string
}

export const legacyUiStyleFindings: LegacyUiStyleFinding[] = [
  {
    area: "option rows",
    payloud: "option-row used 13-14px text, 50px min-height, 9px 11px padding, 8px radius, subtle selected inset bar.",
    medusa_current: "server-option-row was taller and used heavier/larger text.",
    recommendation: "Use 13px body text, 48-50px min-height, 8px 10px padding, 8px radius and inset selected bar.",
  },
  {
    area: "summary panel",
    payloud: "summary panel was sticky, about 16px padding, compact 12.5px rows, price at bottom before actions.",
    medusa_current: "summary panel uses similar structure but roomier typography and row spacing.",
    recommendation: "Keep sticky calculator, tighten row spacing, move visual emphasis to final total and CTA.",
  },
  {
    area: "states",
    payloud: "disabled/required/recommended/warning states had small badges and hover popovers.",
    medusa_current: "current storefront mostly shows validation in summary.",
    recommendation: "Add visual class hooks for warning/disabled/recommended when backend UI state is available.",
  },
  {
    area: "storage/media rows",
    payloud: "drive bay and media bay rows were separate visual patterns with Media Bay suboptions.",
    medusa_current: "Backplanes / Media Bay are one mixed option group.",
    recommendation: "Separate logical groups using specs_json.media_bay before schema migration.",
  },
]
