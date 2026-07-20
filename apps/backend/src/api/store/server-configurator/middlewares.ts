import { MiddlewareRoute } from "@medusajs/framework"
import { validateAndTransformBody } from "@medusajs/framework/http"
import { AddConfiguredServerToCartSchema, RequestConfigurationQuoteSchema, UpdateConfiguredCartLineSchema, ValidateConfiguredCartSchema, ValidateServerConfigurationSchema } from "./validators"

export const serverConfiguratorStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/server-configurator/add-to-cart",
    method: "POST",
    middlewares: [validateAndTransformBody(AddConfiguredServerToCartSchema)],
  },
  {
    matcher: "/store/server-configurator/rfq",
    method: "POST",
    middlewares: [validateAndTransformBody(RequestConfigurationQuoteSchema)],
  },
  {
    matcher: "/store/server-configurator/cart/validate",
    method: "POST",
    middlewares: [validateAndTransformBody(ValidateConfiguredCartSchema)],
  },
  {
    matcher: "/store/server-configurator/cart/lines/:line_id",
    method: "POST",
    middlewares: [validateAndTransformBody(UpdateConfiguredCartLineSchema)],
  },
  {
    matcher: "/store/server-configurator/validate",
    method: "POST",
    middlewares: [validateAndTransformBody(ValidateServerConfigurationSchema)],
  },
  {
    matcher: "/store/server-configurator/price",
    method: "POST",
    middlewares: [validateAndTransformBody(ValidateServerConfigurationSchema)],
  },
  {
    matcher: "/store/server-configurator/save",
    method: "POST",
    middlewares: [validateAndTransformBody(ValidateServerConfigurationSchema)],
  },
]
