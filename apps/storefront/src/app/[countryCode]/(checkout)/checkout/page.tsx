import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { validateConfiguredCartForCheckout } from "@lib/server-configurator/cart-api"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const commerceValidation = await validateConfiguredCartForCheckout()

  if (!commerceValidation.valid) {
    return (
      <div className="content-container py-12">
        <div className="server-summary-messages error" role="alert">
          <h1>Конфигурацию нужно обновить</h1>
          {commerceValidation.errors.map((error: string) => <p key={error}>{error}</p>)}
          <LocalizedClientLink href="/cart">Вернуться в корзину</LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
