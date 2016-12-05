import {fs, path, args, logger, config} from "../loader"
import shell from "shelljs"
import isValidName from "../utils/isValidName"
import {dashlineName, camelName} from "../utils/nameConvert"
import getComponents from "../utils/getComponents"

import extend from "extend"

module.exports = function() {
	var arg = args.npm
	var name = arg.name

	// install all components
	if(name === undefined) {
		var components = getComponents()
		components.forEach(component => {
			if(component.type === "package") {
				var info = JSON.parse(fs.readFileSync(component.path + "/package.json"))
				var dependencies = extend(true, {}, info.dependencies, info.devDependencies)
				for(let dependence in dependencies) {
					shell.exec(`npm install ${dependence}@${dependencies[dependence]}`)
				}
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

	if(!fs.existsSync(componentPath + "/package.json")) {
		logger.error("${name} is not a package.")
		return
	}

	if(arg.install) {
		let install = arg.install
		shell.exec(`npm install ${install}`)
		let file = componentPath + "/package.json"
		fs.readFile(file, (error, content) => {
			if(error) {
				logger.error(`${install} has not been installed, please try again!`)
				return
			}
			let info = JSON.parse(content)
			let [pkg, version] = install.split("@")
			info.dependencies = info.dependencies || {}
			info.dependencies[pkg] = version || "*"
			content = JSON.stringify(info, null, 2)
			fs.writeFile(file, content)
		})
	}
	else if(arg.uninstall) {
		let uninstall = arg.uninstall
		let file = componentPath + "/package.json"
		fs.readFile(file, (error, content) => {
			let info = JSON.parse(content)
			delete info.dependencies[uninstall]
			content = JSON.stringify(info, null, 2)
			fs.writeFile(file, content)
		})
	}
}