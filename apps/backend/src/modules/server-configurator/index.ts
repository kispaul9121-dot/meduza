import { Module } from "@medusajs/framework/utils"
import ServerConfiguratorModuleService from "./service"

export const SERVER_CONFIGURATOR_MODULE = "serverConfigurator"

export default Module(SERVER_CONFIGURATOR_MODULE, {
  service: ServerConfiguratorModuleService,
})
