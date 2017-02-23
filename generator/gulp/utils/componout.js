import {fs, config, exists, load} from "../loader"
import {dashlineName} from "./index"

export function hasComponout(name) {

	if(!exists(config.paths.componouts + "/" + name)) {
		return false
	}

	return true

}

export function getComponout(name) {

	name = dashlineName(name)

	var dir = config.paths.componouts

	var type = "None"
	var info
	var path = `${dir}/${name}`

	if(!exists(path)) {
		return false
	}

	var infofile = path + "/componer.config.js"
	var info = load(infofile)

	return {
		name,
		path,
		type: info.type || "None",
		version: info.version || "None",
		info,
	}

}

export function getComponouts() {

	var dir = config.paths.componouts
	var componouts = []

	fs.readdirSync(dir).forEach(file => componouts.push(getComponout(file)))

	return componouts

}
