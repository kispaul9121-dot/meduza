import { MiddlewareRoute } from "@medusajs/framework"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { AddConfiguredServerToCartSchema } from "./validators"

export const serverConfiguratorStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/server-configurator/add-to-cart",
    method: "POST",
    middlewares: [validateAndTransformBody(AddConfiguredServerToCartSchema)],
  },
]
