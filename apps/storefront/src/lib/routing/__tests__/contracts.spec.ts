import {
  canonicalLegacyServerUrl,
  isB2BPath,
} from "../contracts"

describe("canonical B2B route contracts", () => {
  it.each([
    ["/servers", true],
    ["/servers/hpe-dl360", true],
    ["/components/cpu", true],
    ["/dk/cart", false],
    ["/dk/checkout", false],
  ])("classifies %s", (pathname, expected) => {
    expect(isB2BPath(pathname)).toBe(expected)
  })

  it.each([
    ["http://shop.test/servers?view=compare", "/compare"],
    ["http://shop.test/servers?view=favorites", "/favorites"],
    ["http://shop.test/servers?view=cart", "/cart"],
    ["http://shop.test/servers?component=cpu", "/components/cpu"],
    [
      "http://shop.test/servers?interface=NVMe",
      "/components/storage?interface=NVMe",
    ],
    [
      "http://shop.test/servers?q=PowerEdge%20R640",
      "/servers?search=PowerEdge+R640",
    ],
  ])("canonicalizes %s", (source, expected) => {
    const destination = canonicalLegacyServerUrl(new URL(source))
    expect(`${destination?.pathname}${destination?.search}`).toBe(expected)
  })
})
