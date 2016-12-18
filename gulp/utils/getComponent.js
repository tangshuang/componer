import {config, fs} from "../loader"
import {dashlineName} from "./index"

export function getComponent(name) {

	name = dashlineName(name)

	var componentsPath = config.paths.components

	var type
	var info
	var version
	var path = `${componentsPath}/${name}`

	if(!fs.existsSync(path)) {
		return false
	}

	if(fs.existsSync(`${path}/package.json`)) {
		type = "package"
		info = JSON.parse(fs.readFileSync(`${path}/package.json`))
	}
	else if(fs.existsSync(`${path}/bower.json`)) {
		type = "bower"
		info = JSON.parse(fs.readFileSync(`${path}/bower.json`))
	}
	else if(fs.existsSync(`${path}/componer.json`)) {
		type = "default"
		info = JSON.parse(fs.readFileSync(`${path}/componer.json`))
	}

	return {
		name: name,
		path,
		type,
		version: info ? info.version : undefined,
		info,
	}

}

export function getComponents() {
	
	var componentsPath = config.paths.components
	var components = []

	fs.readdirSync(componentsPath).forEach(file => {
		components.push(getComponent(file))
	})

	return components

}