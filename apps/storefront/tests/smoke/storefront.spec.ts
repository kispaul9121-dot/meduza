import { expect, test } from "@playwright/test"

test("storefront runtime serves robots metadata", async ({ request }) => {
  const response = await request.get("/robots.txt")

  expect(response.ok()).toBeTruthy()
  expect(await response.text()).toContain("User-Agent")
})

test("legacy query routes issue canonical redirects", async ({ request }) => {
  const cases = [
    ["/servers?view=compare", "/compare"],
    ["/servers?view=favorites", "/favorites"],
    ["/servers?component=cpu", "/components/cpu"],
    ["/servers?interface=NVMe", "/components/storage?interface=NVMe"],
    ["/servers?q=PowerEdge%20R640", "/servers?search=PowerEdge+R640"],
  ] as const

  for (const [source, destination] of cases) {
    const response = await request.get(source, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    const location = new URL(response.headers().location, "http://127.0.0.1:8000")
    expect(location.pathname + location.search).toBe(destination)
  }
})

test("direct navigation, refresh and browser history retain canonical pages", async ({ page }) => {
  const consoleErrors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  await page.goto("/servers")
  await expect(page.getByRole("heading", { name: "Каталог серверов" })).toBeVisible()

  await page.getByRole("button", { name: "Сравнение", exact: true }).click()
  await expect(page).toHaveURL(/\/compare$/)
  await expect(page.getByRole("heading", { name: "Сравнение" })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/servers$/)
  await page.goForward()
  await expect(page).toHaveURL(/\/compare$/)
  await page.reload()
  await expect(page.getByRole("heading", { name: "Сравнение" })).toBeVisible()

  await page.screenshot({
    path: test.info().outputPath("canonical-compare.png"),
    // Playwright's default caret hiding mutates the controlled search input
    // while a streamed route can still be hydrating, causing a false mismatch.
    caret: "initial",
  })
  expect(consoleErrors).toEqual([])
})

test("cart region redirect preserves the cart cookie", async ({ context, page }) => {
  await context.addCookies([{
    name: "_medusa_cart_id",
    value: "cart_stage_02",
    domain: "127.0.0.1",
    path: "/",
  }])

  await page.goto("/servers?view=cart")
  await expect(page).toHaveURL(/\/dk\/cart$/)
  await expect(page.getByTestId("cart-container")).toBeVisible()
  const cartCookie = (await context.cookies()).find((cookie) => cookie.name === "_medusa_cart_id")
  expect(cartCookie?.value).toBe("cart_stage_02")
})

test("mobile menu is singular, keyboard dismissible and unknown route reaches 404", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/servers")

  await expect(page.getByRole("button", { name: "Меню", exact: true })).toHaveCount(0)
  const menuButton = page.getByRole("button", { name: "Открыть меню" })
  await expect(menuButton).toHaveCount(1)
  await menuButton.click()
  await expect(menuButton).toHaveAttribute("aria-expanded", "true")
  await page.keyboard.press("Escape")
  await expect(menuButton).toHaveAttribute("aria-expanded", "false")
  await page.screenshot({ path: test.info().outputPath("canonical-mobile.png") })

  const response = await page.goto("/definitely-missing-route")
  expect(response?.status()).toBe(404)
})

test("catalog filters are URL-backed and browser history restores them", async ({ page }) => {
  await page.goto("/servers")
  const brand = page.locator(".server-filter-section").filter({
    has: page.getByRole("heading", { name: "Бренд", exact: true }),
  })
  await brand.getByText("HPE", { exact: true }).locator("..").locator("input").click({ noWaitAfter: true })
  await expect(page).toHaveURL(/brand=HPE/)
  await page.goBack()
  await expect(page).not.toHaveURL(/brand=HPE/)
  await page.goForward()
  await expect(page).toHaveURL(/brand=HPE/)
})

test("HPE and Dell render through the same registry-driven server template", async ({ page }) => {
  await page.goto("/servers")
  const hrefs = await page.locator('.server-product-grid a[href^="/servers/"]').evaluateAll((links) => Array.from(new Set(links.map((link) => link.getAttribute("href")).filter(Boolean))).slice(0, 2))
  expect(hrefs).toHaveLength(2)
  for (const href of hrefs) {
    await page.goto(href!)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("navigation", { name: "Разделы карточки" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Соберите конфигурацию" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Характеристики", exact: true })).toBeVisible()
  }
  await expect(page.getByText(/10SFF NVMe Premium front cage/)).toHaveCount(0)
})

test("component categories and technical identity have honest commerce states", async ({ page }) => {
  await page.goto("/components/cpu")
  await expect(page.getByRole("heading", { name: "Процессоры", level: 1 })).toBeVisible()
  const firstComponent = page.locator(".component-card h2 a").first()
  const componentName = await firstComponent.textContent()
  await expect(firstComponent).toBeVisible()
  await firstComponent.click()
  await expect(page.getByRole("heading", { name: componentName!, level: 1 })).toBeVisible()
  await expect(page.getByText(/Component ID:/)).toBeVisible()
  await expect(page.getByText(/Техническая позиция|Commerce variant связан/)).toBeVisible()
})

test("compare URL is shareable, differences-only works, and favorites persist locally", async ({ page }) => {
  await page.goto("/servers")
  const cards = page.locator(".server-product-card")
  const firstHref = await cards.nth(0).locator('a[href^="/servers/"]').first().getAttribute("href")
  const secondHref = await cards.nth(1).locator('a[href^="/servers/"]').first().getAttribute("href")
  const firstName = (await cards.nth(0).locator("h2").textContent())!.trim()
  const slugs = [firstHref, secondHref].map((href) => href!.split("/").pop()!)
  await page.goto(`/compare?items=${slugs.join(",")}`)
  await expect(page.getByRole("heading", { name: "Сравнение" })).toBeVisible()
  await expect(page.getByRole("columnheader")).toHaveCount(3)
  await page.getByLabel("Только различия").check()
  await expect(page.getByRole("rowheader").first()).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`items=${slugs[0]}(?:%2C|,)${slugs[1]}`))

  await page.addInitScript((slug) => window.localStorage.setItem("payloudProductCollections", JSON.stringify({ favorites: [slug], compare: [], cart: [], quoteRequests: [] })), slugs[0])
  await page.goto("/favorites")
  await expect(page.getByRole("heading", { name: "Избранное" })).toBeVisible()
  await expect(page.getByRole("link", { name: firstName }).first()).toBeVisible()
})

test("registry-driven pages remain usable on mobile and expose focusable controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/components/cpu")
  await page.keyboard.press("Tab")
  await expect(page.locator(":focus")).toBeVisible()
  await expect(page.locator(".component-catalog-layout")).toBeVisible()
  await page.screenshot({ path: test.info().outputPath("stage-10-components-mobile.png"), fullPage: true })
})

test("ready configurations are dynamic, published and clone into configurator state", async ({ page }) => {
  await page.goto("/solutions")
  await expect(page.getByRole("heading", { name: "Проверенные конфигурации", level: 1 })).toBeVisible()
  const firstReady = page.locator('.server-product-grid .server-product-card h2 a[href^="/solutions/"]').first()
  if (await firstReady.count()) {
    await firstReady.click()
    await expect(page.getByRole("heading", { name: "Состав", level: 2 })).toBeVisible()
    await expect(page.getByText(/engine/i).first()).toBeVisible()
    await page.getByRole("link", { name: "Изменить в конфигураторе" }).click()
    await expect(page).toHaveURL(/\/servers\/.+\?ready=.+$/)
  } else {
    await expect(page.getByText("Готовые конфигурации пока не опубликованы")).toBeVisible()
  }
  await page.screenshot({ path: test.info().outputPath("stage-11-ready-clone.png"), fullPage: true })
})
