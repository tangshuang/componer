import {config, logger} from "../loader"
import fs from "fs"
import {getComponents, strPadRight} from "../utils"

module.exports = function() {
	var componentsPath = config.paths.components
	var components = getComponents()

	logger.help(strPadRight(`======================= You have ${components.length} components: ==============`, '=', 70))
	
	logger.put(strPadRight("name", " ", 15)).put("\tversion\t").put("type").print()

	logger("----------------------------------------------------------------------")

	components.forEach(component => {
		logger.put(strPadRight(component.name, " ", 15), {color: "cyan"}).put("\t" + component.version + "\t").put(component.type).print()
	})
	
	logger.help("======================================================================")
}