"use client"

import { HelpCircle } from "lucide-react"
import { HelpAnnotation } from "@lib/server-configurator/data"

export function HelpPopover({
  annotation,
  className = "",
}: {
  annotation?: HelpAnnotation
  className?: string
}) {
  if (!annotation) return null

  return (
    <span className={`group-info-wrap ${className}`}>
      <button className="group-info-badge" type="button" aria-label={`Информация: ${annotation.title}`}>
        <HelpCircle size={13} strokeWidth={2.5} />
      </button>
      <span className="group-info-popover" role="tooltip">
        <strong>{annotation.title}</strong>
        <span>{annotation.body}</span>
        {annotation.source_doc_reference && <small>{annotation.source_doc_reference}</small>}
      </span>
    </span>
  )
}
