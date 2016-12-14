import {config, logger} from "../loader"
import fs from "fs"

module.exports = function() {
	var componentsPath = config.paths.components
	var components = []
	fs.readdirSync(componentsPath).forEach(file => {
		var path = componentsPath + "/" + file
		var type
		var info
		
		if(fs.existsSync(path + "/package.json")) {
			type = "package"
			info = JSON.parse(fs.readFileSync(path + "/package.json"))
		}
		else if(fs.existsSync(path + "/bower.json")) {
			type = "bower"
			info = JSON.parse(fs.readFileSync(path + "/bower.json"))
		}
		else {
			type = "component"
			info = JSON.parse(fs.readFileSync(path + "/componer.json"))
		}

		components.push({
			name: file,
			type,
			version: info.version,
		})
	})

	logger.help(`----------------------- You have ${components.length} components: ---------------------`)
	components.forEach(component => {
		logger.help("  " + component.name)
		logger.log("    type: " + component.type)
		logger.log("    version: " + component.version)
	})
	logger.help("-----------------------------------------------------------------------")
}