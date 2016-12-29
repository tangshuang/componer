import {fs, config, exists, readJSON} from "../loader"
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

	if(exists(`${path}/bower.json`)) {
		type = "bower"
		info = readJSON(`${path}/bower.json`)
	}
	else if(exists(`${path}/package.json`)) {
		type = "package"
		info = readJSON(`${path}/package.json`)
	}
	else if(exists(`${path}/componer.json`)) {
		type = "default"
		info = readJSON(`${path}/componer.json`)
	}

	return {
		name: name,
		path,
		type,
		version: info ? info.version : "None",
		info,
	}

}

export function getComponouts() {

	var dir = config.paths.componouts
	var componouts = []

	fs.readdirSync(dir).forEach(file => componouts.push(getComponout(file)))

	return componouts

}