import { defineMiddlewares } from "@medusajs/framework/http"
import { serverConfiguratorAdminMiddlewares } from "./admin/server-configurator/middlewares"
import { serverConfiguratorStoreMiddlewares } from "./store/server-configurator/middlewares"

export default defineMiddlewares({
  routes: [
    ...serverConfiguratorAdminMiddlewares,
    ...serverConfiguratorStoreMiddlewares,
  ],
})
