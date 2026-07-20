const B2B_ROOTS = [
  "/servers",
  "/compare",
  "/favorites",
  "/components",
  "/solutions",
  "/knowledge",
  "/rfq",
] as const

const LEGACY_VIEW_DESTINATIONS: Record<string, string> = {
  compare: "/compare",
  favorites: "/favorites",
  cart: "/cart",
  ready: "/solutions",
  components: "/components",
  storage: "/components/storage",
  service: "/solutions/service",
  virtualization: "/solutions/virtualization",
  database: "/solutions/database",
  project: "/solutions/project",
  analogs: "/solutions/analogs",
  assembly: "/solutions/assembly",
}

export function isB2BPath(pathname: string) {
  return B2B_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  )
}

function destinationWithRemainingParams(
  source: URL,
  destinationPath: string,
  consumedKeys: string[]
) {
  const destination = new URL(destinationPath, source)
  source.searchParams.forEach((value, key) => {
    if (!consumedKeys.includes(key)) destination.searchParams.append(key, value)
  })
  return destination
}

export function canonicalLegacyServerUrl(source: URL) {
  if (source.pathname !== "/servers") return null

  const view = source.searchParams.get("view")?.toLowerCase()
  if (view && LEGACY_VIEW_DESTINATIONS[view]) {
    return destinationWithRemainingParams(
      source,
      LEGACY_VIEW_DESTINATIONS[view],
      ["view"]
    )
  }

  const component = source.searchParams.get("component")?.toLowerCase()
  if (component && /^[a-z0-9-]+$/.test(component)) {
    return destinationWithRemainingParams(
      source,
      `/components/${component}`,
      ["component"]
    )
  }

  const driveInterface = source.searchParams.get("interface")
  if (driveInterface) {
    const destination = destinationWithRemainingParams(
      source,
      "/components/storage",
      ["interface"]
    )
    destination.searchParams.set("interface", driveInterface)
    return destination
  }

  const query = source.searchParams.get("q")?.trim()
  if (query) {
    const destination = destinationWithRemainingParams(source, "/servers", ["q"])
    destination.searchParams.set("search", query)
    return destination
  }

  return null
}
