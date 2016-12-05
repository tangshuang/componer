import {fs, path, args, logger, config} from "../loader"
import shell from "shelljs"
import isValidName from "../utils/isValidName"
import {dashlineName, camelName} from "../utils/nameConvert"
import getComponents from "../utils/getComponents"

module.exports = function() {
	var arg = args.bower
	var name = arg.name

	// install all components
	if(name === undefined) {
		let components = getComponents()
		components.forEach(component => {
			if(component.type === "bower") {
				shell.exec(`cd "${component.path}" && bower install`)
			}
		})
		return
	}

	// install for a component
	if(!isValidName(name)) {
		return
	}

	name = dashlineName(name)
	var componentPath = path.join(config.paths.components, name)

	if(!fs.existsSync(componentPath + "/bower.json")) {
		logger.error("${name} is not a bower component.")
		return
	}

	if(arg.install && arg.install === true) {
		shell.exec(`cd "${componentPath}" && bower install`)
	}
	else if(arg.install) {
		let component = arg.install
		shell.exec(`cd "${componentPath}" && bower install --save ${component}`)
	}
	else if(arg.update) {
		shell.exec(`cd "${componentPath}" && bower list && bower update && bower list`)
	}
	else if(arg.uninstall) {
		let component = arg.uninstall
		shell.exec(`cd "${componentPath}" && bower uninstall --save ${component}`)
	}
}