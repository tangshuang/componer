import {config} from "../loader"
import fs from "fs"
import logger from "process.logger"

module.exports = function() {
	var componentsPath = config.paths.components
	var components = []
	fs.readdirSync(componentsPath).forEach(file => components.push(file))
	var lines = []
	var line = []

	logger().help(`----------------------- You have ${components.length} components: ---------------------\n`)
	if(components.length < 5) {
		lines.push(components.join("\t"))
	}
	else {
		components.forEach(component => {
			line.push(component)
			if(line.length === 5) {
				lines.push(line.join("\t"))
				line = []
			}
		})
	}
	logger().help(lines.join("\n"))
	logger().help("\n-----------------------------------------------------------------------")
}