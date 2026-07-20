"use client"

import { Button, Heading } from "@modules/common/components/ui"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { validateConfiguredCartForCheckout } from "@lib/server-configurator/cart-api"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const router = useRouter()
  const params = useParams<{ countryCode: string }>()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")

  async function continueToCheckout() {
    setChecking(true)
    setError("")
    const result = await validateConfiguredCartForCheckout()
    if (result.valid) router.push(`/${params.countryCode}/checkout?step=${step}`)
    else setError(result.errors.join(" "))
    setChecking(false)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      <Button className="w-full h-10" data-testid="checkout-button" disabled={checking} onClick={continueToCheckout}>
        {checking ? "Проверяем цену и наличие…" : "Перейти к оформлению"}
      </Button>
    </div>
  )
}

export default Summary
