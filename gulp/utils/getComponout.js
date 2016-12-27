import {config, fs} from "../loader"
import {dashlineName} from "./index"

export function getComponout(name) {

	name = dashlineName(name)

	var dir = config.paths.componouts

	var type = "None"
	var info
	var path = `${dir}/${name}`

	if(!fs.existsSync(path)) {
		return false
	}

	if(fs.existsSync(`${path}/bower.json`)) {
		type = "bower"
		info = JSON.parse(fs.readFileSync(`${path}/bower.json`))
	}
	else if(fs.existsSync(`${path}/package.json`)) {
		type = "package"
		info = JSON.parse(fs.readFileSync(`${path}/package.json`))
	}
	else if(fs.existsSync(`${path}/componer.json`)) {
		type = "componer"
		info = JSON.parse(fs.readFileSync(`${path}/componer.json`))
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

	fs.readdirSync(dir).forEach(file => {
		componouts.push(getComponout(dir + "/" + file))
	})

	return componouts

}