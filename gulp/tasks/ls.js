import {config, logger} from "../loader"
import fs from "fs"
import {getComponents} from "../utils"

module.exports = function() {
	var componentsPath = config.paths.components
	var components = getComponents()

	logger.help(`----------------------- You have ${components.length} components: ---------------------`)
	components.forEach(component => {
		logger.help("  " + component.name)
		logger.log("    type: " + component.type)
		logger.log("    version: " + component.version)
	})
	logger.help("-----------------------------------------------------------------------")
}